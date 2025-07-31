from langchain_nvidia_ai_endpoints import chat_models
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from pydantic import BaseModel, Field
from functools import partial
import os

from langchain_core.runnables import RunnableLambda
from langchain_core.runnables.passthrough import RunnableAssign
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain.output_parsers import PydanticOutputParser

from dotenv import load_dotenv

load_dotenv()
os.environ.get('NVIDIA_API_KEY')

print(ChatNVIDIA.get_available_models())



class KnowledgeBase(BaseModel):
    first_name: str = Field('unknown', description="Chatting user's first name, `unknown` if unknown")
    last_name: str = Field('unknown', description="Chatting user's last name, `unknown` if unknown")
    # confirmation: int = Field(-1, description="Response Confirmation Number, `-1` if unknown")
    discussion_summary: str = Field("", description="Summary of discussion so far, including locations, issues, etc.")
    open_problems: list = Field([], description="Topics that have not been resolved yet")
    current_goals: list = Field([], description="Current goal for the agent to address")
    goal: list = Field([], description="Current goal for the agent to address")


ct_chat = ChatNVIDIA(model="mistralai/mistral-7b-instruct-v0.2")
instruct_llm = ct_chat | StrOutputParser()

print(repr(KnowledgeBase(topic = "Travel")))


instruct_string = PydanticOutputParser(pydantic_object=KnowledgeBase).get_format_instructions()
print(instruct_string)


def RExtract(pydantic_class, llm, prompt):
    '''
    Runnable Extraction module
    Returns a knowledge dictionary populated by slot-filling extraction
    '''
    parser = PydanticOutputParser(pydantic_object=pydantic_class)
    instruct_merge = RunnableAssign({'format_instructions' : lambda x: parser.get_format_instructions()})
    def preparse(string):
        if '{' not in string: string = '{' + string
        if '}' not in string: string = string + '}'
        string = (string
            .replace("\\_", "_")
            .replace("\n", " ")
            .replace("]", "]")
            .replace("[", "[")
        )
        # print(string)  
        return string
    return instruct_merge | prompt | llm | preparse | parser


parser_prompt = ChatPromptTemplate.from_template(
    "Update the knowledge base: {format_instructions}.Your full goal is to create ppt slides data \n "
    "according to the input for the ppt, update the current goal according to how much \n"
    "data has been done and follow the current goal to complete goal \n "
    "Only use information from the input."
    "\n\nNEW MESSAGE: {input}"
)


extractor = RExtract(KnowledgeBase, instruct_llm, parser_prompt)

knowledge = extractor.invoke({'input' : "I want to create a ppt for big data?"})
print(knowledge)


