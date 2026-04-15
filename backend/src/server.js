require('dotenv').config()

const fs = require('node:fs')
const path = require('node:path')
const express = require('express')
const cors = require('cors')
const multer = require('multer')
const prisma = require('./prisma')

const app = express()
const port = Number(process.env.PORT || 5000)
const uploadDirectory = path.join(__dirname, '..', 'uploads')

fs.mkdirSync(uploadDirectory, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectory)
  },
  filename: (_req, file, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase()
    callback(null, `${Date.now()}-${safeName}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ]

    if (!allowedMimeTypes.includes(file.mimetype)) {
      callback(new Error('Only PDF, JPG, PNG, WEBP, and GIF files are allowed'))
      return
    }

    callback(null, true)
  },
})

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())
app.use('/uploads', express.static(uploadDirectory))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'Sarkari Jankari API running' })
})

app.get('/api/categories', async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    })

    res.json(categories)
  } catch (error) {
    next(error)
  }
})

app.get('/api/posts', async (req, res, next) => {
  try {
    const { category, featured, limit } = req.query

    const where = {
      ...(category ? { category: { slug: String(category) } } : {}),
      ...(featured === 'true' ? { isFeatured: true } : {}),
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
      include: {
        category: true,
      },
      take: limit ? Number(limit) : 40,
    })

    res.json(posts)
  } catch (error) {
    next(error)
  }
})

app.get('/api/stats', async (_req, res, next) => {
  try {
    const [postCount, featuredCount, resultCount, admitCardCount] =
      await Promise.all([
        prisma.post.count(),
        prisma.post.count({ where: { isFeatured: true } }),
        prisma.post.count({ where: { category: { slug: 'results' } } }),
        prisma.post.count({ where: { category: { slug: 'admit-cards' } } }),
      ])

    res.json({
      postCount,
      featuredCount,
      resultCount,
      admitCardCount,
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/posts', upload.single('attachment'), async (req, res, next) => {
  const uploadedFile = req.file

  try {
    const {
      title,
      description,
      link,
      categorySlug,
      examDate,
      lastDate,
      status,
      isFeatured,
    } = req.body

    const attachmentUrl = uploadedFile ? `/uploads/${uploadedFile.filename}` : null
    const resolvedLink = link ? String(link) : attachmentUrl

    if (!title || !categorySlug || !resolvedLink) {
      return res.status(400).json({
        message: 'title, categorySlug and either link or attachment are required',
      })
    }

    const category = await prisma.category.findUnique({
      where: { slug: String(categorySlug) },
    })

    if (!category) {
      return res.status(404).json({ message: 'category not found' })
    }

    const created = await prisma.post.create({
      data: {
        title: String(title),
        description: description ? String(description) : null,
        link: resolvedLink,
        attachmentName: uploadedFile ? uploadedFile.originalname : null,
        attachmentType: uploadedFile ? uploadedFile.mimetype : null,
        attachmentUrl,
        examDate: examDate ? new Date(examDate) : null,
        lastDate: lastDate ? new Date(lastDate) : null,
        status: status ? String(status) : 'Open',
        isFeatured: Boolean(isFeatured),
        categoryId: category.id,
      },
      include: {
        category: true,
      },
    })

    res.status(201).json(created)
  } catch (error) {
    if (uploadedFile?.path) {
      fs.rm(uploadedFile.path, { force: true }, () => {})
    }

    next(error)
  }
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ message: 'Something went wrong', detail: error.message })
})

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})
