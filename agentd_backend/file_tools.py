# file_tools.py
from langchain.tools import tool
import os
from typing import Literal

@tool
def create_file(path: str, content: str) -> str:
    """
    Creates a new file at the specified path with the given content.
    If the file or its parent directories do not exist, they will be created.
    If the file already exists, it will be overwritten.

    Args:
        path (str): The full path including the filename (e.g., "my_directory/new_file.txt").
        content (str): The content to write into the new file.

    Returns:
        str: A success message or an error message if the operation fails.
    """
    try:
        # Ensure the directory exists
        directory = os.path.dirname(path)
        if directory and not os.path.exists(directory):
            os.makedirs(directory, exist_ok=True) # exist_ok=True prevents error if dir exists
            print(f"Created directory: {directory}")

        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        return f"Successfully created and wrote content to file: {path}"
    except Exception as e:
        return f"Error creating file {path}: {str(e)}"

@tool
def write_file(path: str, content: str, mode: Literal['overwrite', 'append'] = 'overwrite') -> str:
    """
    Writes content to an existing file.

    Args:
        path (str): The full path to the file.
        content (str): The content to write.
        mode (Literal['overwrite', 'append']): 'overwrite' to replace content (default),
                                              'append' to add to the end of the file.

    Returns:
        str: A success message or an error message.
    """
    try:
        if not os.path.exists(path):
            return f"Error writing to file {path}: File does not exist. Use 'create_file' to create a new file."

        file_mode = 'w' if mode == 'overwrite' else 'a'
        with open(path, file_mode, encoding='utf-8') as f:
            f.write(content)
        return f"Successfully {mode} content to file: {path}"
    except Exception as e:
        return f"Error writing to file {path} in '{mode}' mode: {str(e)}"

@tool
def read_file(path: str) -> str:
    """
    Reads the content of a file and returns it as a string.

    Args:
        path (str): The full path to the file.

    Returns:
        str: The content of the file, or an error message if reading fails.
    """
    try:
        if not os.path.exists(path):
            return f"Error reading file {path}: File does not exist."
        if not os.path.isfile(path):
            return f"Error reading file {path}: Path is not a file."

        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        return content
    except Exception as e:
        return f"Error reading file {path}: {str(e)}"

@tool
def replace_in_file(path: str, old_string: str, new_string: str) -> str:
    """
    Replaces all occurrences of a specified 'old_string' with a 'new_string' within a file.
    This is useful for modifying configurations or styles (e.g., changing a CSS color).

    Args:
        path (str): The full path to the file.
        old_string (str): The string to search for and replace.
        new_string (str): The string to replace with.

    Returns:
        str: A success message indicating replacements made, or an error message.
    """
    try:
        if not os.path.exists(path):
            return f"Error replacing in file {path}: File does not exist."
        if not os.path.isfile(path):
            return f"Error replacing in file {path}: Path is not a file."

        # Read the file content
        with open(path, 'r', encoding='utf-8') as f:
            file_content = f.read()

        # Perform the replacement
        updated_content = file_content.replace(old_string, new_string)

        if updated_content == file_content:
            return f"No occurrences of '{old_string}' found in {path}. File not modified."

        # Write the modified content back to the file (overwriting)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(updated_content)

        return f"Successfully replaced all occurrences of '{old_string}' with '{new_string}' in {path}."
    except Exception as e:
        return f"Error replacing in file {path}: {str(e)}"

@tool
def delete_file(path: str) -> str:
    """
    Deletes a specified file.

    Args:
        path (str): The full path to the file to be deleted.

    Returns:
        str: A success message or an error message if deletion fails.
    """
    try:
        if not os.path.exists(path):
            return f"Error deleting file {path}: File does not exist."
        if not os.path.isfile(path):
            return f"Error deleting file {path}: Path is not a file."

        os.remove(path)
        return f"Successfully deleted file: {path}"
    except Exception as e:
        return f"Error deleting file {path}: {str(e)}"


# Helper function to get all tools from this module
def get_file_tools():
    return [create_file, write_file, read_file, replace_in_file, delete_file]

