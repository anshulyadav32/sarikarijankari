import json

def flatten():
    try:
        with open('data.json', 'r', encoding='utf-8') as f:
            old_data = json.load(f)
        
        if isinstance(old_data, list):
            print("data.json is already a flat list.")
            return

        new_data = []
        for cat_name, items in old_data.items():
            for item in items:
                item['category'] = cat_name
                new_data.append(item)
        
        with open('data.json', 'w', encoding='utf-8') as f:
            json.dump(new_data, f, ensure_ascii=False, indent=4)
        
        print(f"Flattened {len(new_data)} items and saved to data.json")
    except Exception as e:
        print(f"Error flattening: {e}")

if __name__ == "__main__":
    flatten()
