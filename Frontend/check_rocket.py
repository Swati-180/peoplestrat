import os
import re

def check_imports():
    root_dir = r"d:\AntiGravity\PeopleStat\PeopleStat\Frontend\src"
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith((".jsx", ".js")):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    # Check for Rocket usage but no Rocket import from lucide-react
                    if "Rocket" in content:
                        import_pattern = re.compile(r'import\s+{[^}]*Rocket[^}]*}\s+from\s+["\']lucide-react["\']')
                        if not import_pattern.search(content):
                            print(f"File {path} uses Rocket but it's not imported from lucide-react")

if __name__ == "__main__":
    check_imports()
