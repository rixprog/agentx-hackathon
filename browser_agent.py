
import asyncio
from browser_use import Agent, BrowserSession,Controller
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel,Field
from typing import List

# important 
# use uv for installation look at the documentation 
# start brave --user-data-dir="C:\Users\<your username>\AppData\Local\browseruse\profiles\default" type this in your cmd and login in websites like chatgpt etc so that when the agnet enters it doent need to login manually
# i used brave broswer , worked well in that 


llm= ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key="your api key ")

browser_session = BrowserSession(
    # Path to a specific Chromium-based executable (optional)
    executable_path='C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',  # macOS
    downloads_path='Downloads',
    # Use a specific data directory on disk (optional, set to None for incognito)
    user_data_dir=r'C:\Users\<your username>\AppData\Local\browseruse\profiles\default',  
)


# add fields as necessary

class Code(BaseModel):
    code: str = Field(..., description="The source code content")

    file_name: str = Field(..., description="Name of the file, including extension")
    commands_to_install_dependencies: List[str] = Field(
        default_factory=list,
        description="Shell commands needed to install dependencies"
    )
	
     
controller = Controller(output_model=Code)

task = """
1. search gemini
2. click the first link
3. ask it to generate an image
"""



# dont knwow where the donwloads go  when ask the agent to download the image but works fine 
# donwt open any other browser in parallel sometimes not work prooperly 


async def main():
	agent = Agent(task=task, llm=llm, controller=controller,browser_session=browser_session)

	history = await agent.run()

	result = history.final_result()
	if result:
		parsed: Code = Code.model_validate_json(result)
		print(parsed.code)
		print(parsed.file_name)
		print(parsed.img_url)
		print(parsed.commands_to_install_dependencies)
	else:
		print('No result')


if __name__ == '__main__':
	asyncio.run(main())
    

