import subprocess
import platform
import json


def execute_shell_command(command: str, requires_admin: bool = False):
    """
    Executes a shell command and captures its output.
    ... (rest of your docstring) ...
    """
    current_os = platform.system()
    events = []
    
    def add_event(event_type, content):
        events.append({
            'type': event_type,
            'content': content
        })
    
    add_event('start', f"Detected OS: {current_os}")
    full_command = command

    # Prepend 'sudo' if required and on a Unix-like system
    if requires_admin:
        if current_os in ["Linux", "Darwin"]:  # Darwin is macOS
            full_command = f"sudo {command}"
            add_event('info', f"Attempting to execute: {full_command} (You may be prompted for your password)")
        else:
            add_event('info', "Note: 'requires_admin' flag is set, but 'sudo' is not applicable on Windows.")
            add_event('info', "You must ensure this script (or the command itself) is run with administrative privileges on Windows.")
            add_event('info', f"Attempting to execute: {full_command}")

    add_event('command', f"Executing: {full_command}")

    try:
        process = subprocess.run(
            full_command,
            shell=True,
            capture_output=True,
            text=True,
            check=False  # Don't raise CalledProcessError for non-zero exit codes
        )

        add_event('output', f"Return Code: {process.returncode}")
        if process.stdout.strip():
            add_event('output', f"STDOUT:\n{process.stdout.strip()}")
        if process.stderr.strip():
            add_event('error', f"STDERR:\n{process.stderr.strip()}")

        if process.returncode == 0:
            result = {
                'status': 'success',
                'stdout': process.stdout.strip(),
                'stderr': process.stderr.strip(),
                'returncode': process.returncode,
                'message': f"Command executed successfully on {current_os}.",
                'events': events
            }
        else:
            result = {
                'status': 'error',
                'stdout': process.stdout.strip(),
                'stderr': process.stderr.strip(),
                'returncode': process.returncode,
                'message': f"Command failed with exit code {process.returncode} on {current_os}.",
                'events': events
            }
        
        return result

    except FileNotFoundError:
        error_result = {
            'status': 'error',
            'stdout': '',
            'stderr': f"Command '{command}' not found. Please check the command and your system's PATH.",
            'returncode': -1,
            'message': "Command not found.",
            'events': events
        }
        add_event('error', error_result['stderr'])
        return error_result
    except Exception as e:
        error_result = {
            'status': 'error',
            'stdout': '',
            'stderr': str(e),
            'returncode': -2,
            'message': f"An unexpected error occurred: {e}",
            'events': events
        }
        add_event('error', error_result['stderr'])
        return error_result