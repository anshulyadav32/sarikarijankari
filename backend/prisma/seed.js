require('dotenv').config()

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const categoryData = [
    { name: 'Latest Jobs', slug: 'latest-jobs', color: '#f59e0b' },
    { name: 'Results', slug: 'results', color: '#dc2626' },
    { name: 'Admit Cards', slug: 'admit-cards', color: '#2563eb' },
    { name: 'Answer Key', slug: 'answer-key', color: '#7c3aed' },
    { name: 'Syllabus', slug: 'syllabus', color: '#0f766e' },
  ]

  for (const category of categoryData) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    })
  }

  const categories = await prisma.category.findMany()
  const bySlug = categories.reduce((acc, category) => {
    acc[category.slug] = category.id
    return acc
  }, {})

  const postData = [
    {
      title: 'UP Police Constable Recruitment 2026 Apply Online',
      description: 'Notification released for 5200 posts across multiple districts.',
      link: 'https://example.com/jobs/up-police-constable-2026',
      categoryId: bySlug['latest-jobs'],
      status: 'Open',
      isFeatured: true,
      lastDate: new Date('2026-05-20'),
      examDate: new Date('2026-07-10'),
    },
    {
      title: 'SSC CHSL 2025 Tier-I Result Declared',
      description: 'Check roll number wise result PDF and cut-off marks.',
      link: 'https://example.com/results/ssc-chsl-2025-tier-1',
      categoryId: bySlug.results,
      status: 'Published',
      isFeatured: true,
    },
    {
      title: 'RRB NTPC Admit Card 2026 Download Link',
      description: 'City intimation and exam date notice available now.',
      link: 'https://example.com/admit-card/rrb-ntpc-2026',
      categoryId: bySlug['admit-cards'],
      status: 'Published',
      isFeatured: false,
      examDate: new Date('2026-06-02'),
    },
    {
      title: 'Bihar STET Answer Key 2026 Released',
      description: 'Challenge window is open for 5 days.',
      link: 'https://example.com/answer-key/bihar-stet-2026',
      categoryId: bySlug['answer-key'],
      status: 'Published',
      isFeatured: false,
    },
    {
      title: 'UPSC CSE 2026 Updated Syllabus PDF',
      description: 'Detailed changes in GS papers and optional subjects.',
      link: 'https://example.com/syllabus/upsc-cse-2026',
      categoryId: bySlug.syllabus,
      status: 'Published',
      isFeatured: false,
    },
  ]

  for (const post of postData) {
    await prisma.post.upsert({
      where: { link: post.link },
      update: post,
      create: post,
    })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
    console.log('Seed completed')
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
