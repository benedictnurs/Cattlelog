import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

llm = ChatGoogleGenerativeAI(
    apiKey=os.environ["GOOGLE_API_KEY"],
    model="gemini-2.5-flash-lite"
)

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a professional academic advisor for UC Davis students. Your task is to summarize student reviews into a brief, professional recommendation to guarantee student success by advising them properly. "
            "Please analyze and summarize each class the professor teaches based on the student reviews. "
            "You want the best experience for the students so be sure to be super critical yet fair. "
            "Give recommendations based on how the student's learning experience would be and the fairness and reasonability of the professor. "
            "Make sure to focus on the overall sentiment given by the population. "
            "If there are no reviews for a specific class, note that no data is available and make reasonable "
            "Summarize but dont mention that you are summarizing make it seem as if you already know the professor. "
            "inferences based on the professor's general style. "
            "Attempt to be as neutral as possible but be strict on the advice and summary as we want students to succeed. "
            "In the final verdict decide if students should take, consider or avoid. "
            "CRITICAL FORMATTING RULES: "
            "1. Start with a clear recommendation: 'Recommended' , 'Avoid' or 'Consider' "
            "2. Keep the entire summary to 2 sentences maximum "
            "3. Write in plain text only - NO bullet points, NO asterisks, NO special formatting, NO line breaks "
            "4. Be direct and factual "
            "5. Focus on the most important patterns in the reviews "
            "6. Be clear and concise giving students a super detailed understanding whilst being brief. "
            "7. Use 'Consider' when the reviews are mixed or average."
            "8. Take into account the professor's overall rating and level of difficulty when summarizing, however also focus the reviews themselves, and be supercritical especially when recommending. "
            "Strictly follow this exact format when recommending: 'Recommended. Consistently praised with clear explanations and engaging lectures, though the workload is heavy. Office hours are very helpful for understanding difficult concepts.'"
            "Strictly follow this exact format when suggesting to avoid: 'Avoid. Consistently criticized for unclear explanations and a disorganized course structure. Many students found the workload to be excessive and unmanageable.'",
        ),
        ("human", "Given the information on \n\n{professor_info}. Please summarize these reviews:\n\n{reviews}"),
    ]
)
chain = prompt | llm


def summarize_reviews(professor_info: dict, reviews: list[str]) -> str:
    """
    Summarize a list of student reviews into a single coherent summary.

    Args:
        professor_info (dict): Dictionary containing professor information (name, department, etc.)
        reviews (list[str]): A list of student review strings

    Returns:
        str: A concise summary of all the reviews
    """
    if not reviews:
        return "No reviews available."
    
    # Join all reviews with clear separation
    reviews_text = "\n\n---\n\n".join([f"Review {i+1}: {review}" for i, review in enumerate(reviews)])
    
    # Format professor info for the prompt
    prof_info_text = f"Professor: {professor_info.get('name', 'Unknown')}\n"
    prof_info_text += f"Department: {professor_info.get('department', 'Unknown')}\n"
    prof_info_text += f"Overall Rating: {professor_info.get('overall_rating', 'N/A')}\n"
    prof_info_text += f"Difficulty Level: {professor_info.get('level_of_difficulty', 'N/A')}"
    
    # Invoke the chain with the reviews and professor info
    response = chain.invoke({"professor_info": prof_info_text, "reviews": reviews_text})
    # Extract the content from the response
    return response.content

