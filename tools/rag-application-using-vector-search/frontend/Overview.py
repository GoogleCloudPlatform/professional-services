# frontend/Overview.py
import streamlit as st

def run():
    """
    Displays the main overview page for the RAG Application.
    """
    st.set_page_config(
        page_title="RAG Application Overview",
        page_icon="📄",
        layout="wide"
    )

    st.title("RAG Application Overview 📄")

    st.markdown("""
    Welcome to the RAG (Retrieval-Augmented Generation) Application.

    This platform provides tools and templates to manage data extraction, 
    transformation, embedding generation, index updates, and embedding serving for building:
    1.  RAG architectures
    2.  Search applications
    3.  Recommendation systems

    Use the navigation to get started.
    """)

    st.subheader("🚀 Get Started")
    if st.button("Start New Ingestion Job", type="primary"):
        st.switch_page("pages/Data_Ingestion.py")

    # Remove these lines to avoid duplicate navigation
    # st.sidebar.success("Select a page above or an option here.")
    # st.sidebar.page_link("Overview.py", label="Home / Overview")
    # st.sidebar.page_link("pages/Data_Ingestion.py", label="Data Ingestion")


if __name__ == "__main__":
    run()