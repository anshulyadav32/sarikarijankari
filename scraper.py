import requests
from bs4 import BeautifulSoup
import json
import time

BASE_URL = "https://sarkariresult.com.cm/"

CATEGORIES = {
    "latest_jobs": "latest-job/",
    "admit_cards": "admit-card/",
    "results": "result/",
    "admissions": "admission/",
    "syllabus": "syllabus/",
    "answer_key": "answer-key/"
}

def get_soup(url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return BeautifulSoup(response.text, 'html.parser')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def scrape_category(category_name, path):
    url = BASE_URL + path
    print(f"Scraping category: {category_name} from {url}")
    soup = get_soup(url)
    if not soup:
        return []

    items = []
    # Based on common structures, we look for links in lists
    # We'll try to find the main content area
    content = soup.find('div', class_='entry-content') or soup.find('div', id='content') or soup.find('main')
    
    if not content:
        # Fallback to all links if specific container not found
        content = soup

    links = content.find_all('a')
    for link in links:
        title = link.get_text(strip=True)
        href = link.get('href')
        
        if href and href.startswith(BASE_URL) and title:
            # Avoid menu links and common footer links
            if any(x in href for x in ['contact-us', 'privacy-policy', 'disclaimer', 'about-us']):
                continue
            
            # Simple heuristic: posts usually have a longer path or specific structure
            # For now, we'll take all links that look like posts
            if href != url and href != BASE_URL:
                items.append({
                    "title": title,
                    "url": href
                })
    
    # Remove duplicates
    unique_items = []
    seen_urls = set()
    for item in items:
        if item['url'] not in seen_urls:
            unique_items.append(item)
            seen_urls.add(item['url'])
            
    return unique_items

def scrape_post_details(post_url):
    print(f"  Scraping post: {post_url}")
    soup = get_soup(post_url)
    if not soup:
        return {}

    data = {"url": post_url}
    
    # Extract Title
    title_tag = soup.find('h1')
    if title_tag:
        data["title"] = title_tag.get_text(strip=True)

    # Extract Content
    # Try various common content containers
    content = soup.find('div', class_='entry-content') or \
              soup.find('main', class_='site-main') or \
              soup.find('div', id='content') or \
              soup.find('article')
    
    if content:
        # Try to find tables which usually contain the structured data
        tables = content.find_all('table')
        data["tables"] = []
        for table in tables:
            table_data = []
            rows = table.find_all('tr')
            for row in rows:
                cols = row.find_all(['td', 'th'])
                cols_text = [col.get_text(strip=True) for col in cols]
                if cols_text:
                    table_data.append(cols_text)
            if table_data:
                data["tables"].append(table_data)
        
        # Extract plain text
        data["full_text"] = content.get_text(separator='\n', strip=True)
    elif not data.get("tables"):
        # Last ditch effort: find all tables in the page if content container not found
        tables = soup.find_all('table')
        data["tables"] = []
        for table in tables:
            table_data = []
            rows = table.find_all('tr')
            for row in rows:
                cols = row.find_all(['td', 'th'])
                cols_text = [col.get_text(strip=True) for col in cols]
                if cols_text:
                    table_data.append(cols_text)
            if table_data:
                data["tables"].append(table_data)

    return data

def main():
    flat_data = []
    
    for cat_name, path in CATEGORIES.items():
        items = scrape_category(cat_name, path)
        print(f"Found {len(items)} items in {cat_name}")
        
        for item in items:
            details = scrape_post_details(item['url'])
            if details:
                # Add category info to each item
                details['category'] = cat_name
                flat_data.append(details)
            time.sleep(0.5)
            
    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(flat_data, f, ensure_ascii=False, indent=4)
    
    print(f"Scraping complete. {len(flat_data)} total items saved to data.json")

if __name__ == "__main__":
    main()
