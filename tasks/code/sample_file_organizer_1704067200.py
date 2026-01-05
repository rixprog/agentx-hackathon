#!/usr/bin/env python3
"""
Sample Agent: File Organizer
This agent organizes files in a directory by type.
"""

import os
import shutil
from pathlib import Path
from typing import Dict, List
import asyncio
from datetime import datetime

class FileOrganizerAgent:
    def __init__(self):
        self.file_types = {
            'images': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'],
            'documents': ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'],
            'spreadsheets': ['.xls', '.xlsx', '.csv', '.ods'],
            'presentations': ['.ppt', '.pptx', '.odp'],
            'videos': ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv'],
            'audio': ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma'],
            'archives': ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'],
            'code': ['.py', '.js', '.html', '.css', '.java', '.cpp', '.c', '.php'],
            'executables': ['.exe', '.msi', '.dmg', '.pkg', '.deb', '.rpm']
        }

    def organize_files(self, directory: str) -> Dict[str, List[str]]:
        """Organize files in the given directory by type."""
        results = {}

        if not os.path.exists(directory):
            print(f"Directory {directory} does not exist!")
            return results

        print(f"Organizing files in: {directory}")

        for filename in os.listdir(directory):
            filepath = os.path.join(directory, filename)

            if os.path.isfile(filepath):
                file_ext = Path(filename).suffix.lower()

                # Find the appropriate category
                category = 'others'
                for cat, extensions in self.file_types.items():
                    if file_ext in extensions:
                        category = cat
                        break

                # Create category directory if it doesn't exist
                category_dir = os.path.join(directory, category)
                if not os.path.exists(category_dir):
                    os.makedirs(category_dir)
                    print(f"Created directory: {category}")

                # Move the file
                new_filepath = os.path.join(category_dir, filename)
                try:
                    shutil.move(filepath, new_filepath)
                    if category not in results:
                        results[category] = []
                    results[category].append(filename)
                    print(f"Moved {filename} to {category}/")
                except Exception as e:
                    print(f"Error moving {filename}: {e}")

        return results

async def main():
    """Main execution function."""
    print("File Organizer Agent Starting...")
    print("=" * 50)

    # Default directory to organize (can be made configurable)
    target_directory = os.getcwd()  # Current working directory

    print(f"Target directory: {target_directory}")
    print("Scanning and organizing files...")

    agent = FileOrganizerAgent()
    results = agent.organize_files(target_directory)

    print("\n" + "=" * 50)
    print("ORGANIZATION COMPLETE!")
    print("=" * 50)

    if results:
        print("Files organized by category:")
        for category, files in results.items():
            print(f"\n{category.upper()}:")
            for file in files:
                print(f"  - {file}")
    else:
        print("No files were organized.")

    print(f"\nTotal categories created: {len(results)}")
    print(f"Total files moved: {sum(len(files) for files in results.values())}")

if __name__ == "__main__":
    asyncio.run(main())