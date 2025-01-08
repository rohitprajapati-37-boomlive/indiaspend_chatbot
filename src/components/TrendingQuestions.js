import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { AiFillAccountBook } from "react-icons/ai";
import {
  FcRefresh,
  FcVoicePresentation,
  FcReading,
  FcLeftUp2,
  FcApproval,
  FcPositiveDynamic,
  FcShipped,
  FcCloseUpMode,
  FcDownRight,
  FcQuestions,
  FcAbout,
} from "react-icons/fc";
import {
  FaCheck,
  FaReply,
  FaThumbsUp,
  FaBullseye,
  FaExclamationCircle,
} from "react-icons/fa";
import Footer from "./Footer";
import "../styles/TrendingQuestions.css";

const getRandomQuestions = (questionsArray, count) => {
  const randomQuestions = [];
  const questionsCopy = [...questionsArray];

  for (let i = 0; i < count; i++) {
    if (questionsCopy.length === 0) break;
    const randomIndex = Math.floor(Math.random() * questionsCopy.length);
    randomQuestions.push(questionsCopy.splice(randomIndex, 1)[0]);
  }

  return randomQuestions;
};

const cleanQuestion = (question) => {
  return question
    .replace(/^Article\s*\d*: \s*/, "")
    .replace(/^- /, "")
    .trim();
};

const getRandomIcon = (icons) => {
  const randomIndex = Math.floor(Math.random() * icons.length);
  return icons[randomIndex];
};

const questionIcons = [<FcQuestions size={40} />];

const answerIcons = [
  <FaCheck size={40} />,
  <FaReply size={40} />,
  <FaThumbsUp size={40} />,
  <FaBullseye size={40} />,
  <FaExclamationCircle size={40} />,
];

function TrendingQuestions() {
  const [questions, setQuestions] = useState([]);
  const [questionsSet, setQuestionsSet] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [expandedAnswer, setExpandedAnswer] = useState(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          "http://u4sg8g4ks4k0k8g00osgwos0.178.16.139.168.sslip.io/generate_questions",
          { method: "GET", headers: { "Content-Type": "application/json" } }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch questions");
        }

        const data = await response.json();
        const cleanedQuestions = data.questions.map(cleanQuestion);
        const nonEmptyQuestions = cleanedQuestions.filter((q) => q !== "");
        setQuestionsSet(nonEmptyQuestions);
        const randomQuestions = getRandomQuestions(nonEmptyQuestions, 4);
        setQuestions(randomQuestions);
      } catch (error) {
        setError("Error fetching questions");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const handleQuestionClick = async (question) => {
    setSelectedQuestion(question);
    setLoading(true);

    try {
      const response = await fetch(
        `http://u4sg8g4ks4k0k8g00osgwos0.178.16.139.168.sslip.io/query?question=${encodeURIComponent(
          question
        )}&thread_id=default`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );

      if (!response.ok) {
        throw new Error("Failed to get answer");
      }

      const data = await response.json();
      const fetchedAnswer = data.response || "No answer found.";
      const fetchedSources = data.sources || [];

      // Fetch metadata for the sources
      const metadataResponse = await fetchMetadataFromApi(fetchedSources);
      const sourcesWithMetadata =
        metadataResponse?.final_response.map((meta) => ({
          url: meta.post_url,
          image: meta.preview_image_url,
          title: meta.title,
        })) || [];

      setAnswer(fetchedAnswer);
      setSources(sourcesWithMetadata);

      const updatedHistory = [
        {
          question,
          answer: fetchedAnswer,
          sources: sourcesWithMetadata,
          timestamp: new Date().toISOString(),
        },
        ...history,
      ];
      setHistory(updatedHistory);

      localStorage.setItem("questionHistory", JSON.stringify(updatedHistory));
    } catch {
      setAnswer("Sorry, there was an issue fetching the answer.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadataFromApi = async (urls) => {
    try {
      // Convert the URLs array into a JSON string
      const urlParam = JSON.stringify(urls);

      // Make the API call
      const response = await fetch(
        `https://toolbox.boomlive.in/api_project/mediator_vue.php?get_metadata_from_arr=${encodeURIComponent(
          urlParam
        )}`
      );

      if (response.ok) {
        // Parse and return the JSON response
        return await response.json();
      } else {
        throw new Error(`Failed to fetch metadata: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching metadata from API:", error);
      throw error; // Re-throw the error for the calling code to handle
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    const fetchNewQuestions = async () => {
      try {
        const randomQuestions = getRandomQuestions(questionsSet, 4);
        setQuestions(randomQuestions);
      } catch (error) {
        setError("Error fetching questions");
      } finally {
        setLoading(false);
      }
    };
    fetchNewQuestions();
  };

  const renderAnswerPoints = () => {
    return <ReactMarkdown>{answer}</ReactMarkdown>;
  };

  // Render sources section with metadata
  const renderSources = () => {
    if (sources.length === 0) {
      return <p>No sources available.</p>;
    }

    return (
      <ul>
        {sources.map((source, index) => (
          <li key={index} className="sources-tle-url">
            <div className="txt-source-url">
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                <img
                  src={source.image}
                  alt={source.title}
                  className="source-image"
                />
                <span>{source.title || source.url}</span>
              </a>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <>
      <main className="trending-questions">
        <h2>Trending Questions</h2>
        {history.length > 0 && (
          <div className="history-section">
            <div className="history-list">
              <ul className="history-items">
                {history.map((item, index) => (
                  <li key={index} className="history-card">
                    <div className="question-content">
                      <div className="question-icon">
                        <FcVoicePresentation />
                      </div>
                      <h3 className="question-text">{item.question}</h3>
                    </div>
                    <div className="answer-content">
                      <div className="answer-icon">
                        <FcReading />
                      </div>
                      <p
                        className="answer-preview"
                        onClick={() =>
                          setExpandedAnswer(
                            expandedAnswer === item.answer ? null : item.answer
                          )
                        }
                      >
                        <ReactMarkdown>
                          {expandedAnswer === item.answer
                            ? item.answer
                            : `${item.answer.substring(0, 250)}...`}
                        </ReactMarkdown>
                        <div className="sources-section">
                          <h4>Sources:</h4>
                          {renderSources()}
                        </div>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {error && <p className="error">{error}</p>}

        {loading ? (
          <div className="loading">
            <div className="skeleton-card">
              <div className="skeleton-loader"></div>
              <div className="skeleton-item"></div>
              <div className="skeleton-item"></div>
            </div>
          </div>
        ) : selectedQuestion ? (
          <div className="question-answer">
            <div className="question-content">
              <div className="question-icon">
                <FcVoicePresentation />
              </div>
              <h3>{selectedQuestion}</h3>
            </div>
            <div className="answer-content">
              <div className="answer-icon">
                <FcReading />
              </div>
              <div className="answer-txt-rk">{renderAnswerPoints()}</div>
            </div>
            <div className="sources-section">
              <h4>Sources:</h4>
              {sources.length > 0 ? (
                <ul>
                  {sources.map((source, index) => (
                    <li key={index} className="sources-tle-url">
                      {/* <FcAbout size={30} /> */}
                      <div className="txt-source-url">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={source.image}
                            alt={source.title}
                            className="source-image"
                          />
                          <span>{source.title || source.url}</span>
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No sources available.</p>
              )}
            </div>

            <button
              onClick={() => setSelectedQuestion(null)}
              aria-label="Go back to question list"
            >
              <FcLeftUp2 size={30} color="blue" /> Back
            </button>
          </div>
        ) : (
          <div className="questions-grid">
            {Array.isArray(questions) && questions.length > 0 ? (
              questions.map((q, index) => (
                <div
                  key={index}
                  className="question-card"
                  onClick={() => handleQuestionClick(q)}
                >
                  <div className="question-icon">
                    {getRandomIcon(questionIcons)}
                  </div>
                  <h3 className="question-text">{q}</h3>
                </div>
              ))
            ) : (
              <p>No questions found.</p>
            )}

            <div className="refresh-button-container">
              <button onClick={handleRefresh}>
                Refresh{" "}
                <FcRefresh size={30} color="blue" className="refreshingrk" />
              </button>
            </div>
          </div>
        )}
      </main>
      <div className="footer-sectionrk">
        <Footer onSubmitQuestion={handleQuestionClick} />
      </div>
    </>
  );
}

export default TrendingQuestions;