import os
import time
import asyncio
from dotenv import load_dotenv
from browser_use_sdk import BrowserUse
from .progress_gemini import generate_progress_steps
from langchain.tools import tool

load_dotenv()

@tool
async def browse_web_cloud(query: str):
    """
    Browse the web using BrowserUse cloud service to find information based on the query.
    
    Args:
        query (str): The search query or task to perform on the web.
    
    Returns:
        dict: A dictionary containing the status and output of the browsing task.
    """
    try:
        # Generate Gemini-based progress steps (optional, for logging)
        steps = generate_progress_steps(query)
        
        # Run Browser Use cloud task
        client = BrowserUse(
            api_key=os.getenv("BROWSER_USE_API_KEY")
        )
        
        task = client.tasks.create_task(
            task=query,
            llm="browser-use-llm"
        )
        
        result = task.complete()
        
        return {
            'status': 'success',
            'output': result.output,
            'message': 'Web browsing task completed successfully.'
        }
        
    except Exception as e:
        return {
            'status': 'error',
            'output': '',
            'message': f'Error during web browsing: {str(e)}'
        }

PROMPT = """
Find the best restaurants in New York City and list their names and addresses.
"""

async def main():
    # 1. Generate Gemini-based progress steps
    steps = generate_progress_steps(PROMPT)

    print("\n🔵 LIVE PROGRESS (Gemini):\n")
    for i, step in enumerate(steps, 1):
        print(f"[{i}/{len(steps)}] {step}")
        time.sleep(1)

    # 2. Run Browser Use cloud task
    client = BrowserUse(
        api_key=os.getenv("BROWSER_USE_API_KEY")
    )

    task = client.tasks.create_task(
        task=PROMPT,
        llm="browser-use-llm"
    )

    result = task.complete()

    print("\n✅ FINAL OUTPUT:\n")
    print(result.output)

if __name__ == "__main__":
    asyncio.run(main())
