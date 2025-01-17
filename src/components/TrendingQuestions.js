import React, { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { AiFillAccountBook } from "react-icons/ai";
import {
  FcRefresh,
  FcVoicePresentation,
  FcReading,
  FcQuestions,
} from "react-icons/fc";
import {
  FaCheck,
  FaReply,
  FaThumbsUp,
  FaBullseye,
  FaExclamationCircle,
  FaLongArrowAltDown,
  FaLongArrowAltUp,
} from "react-icons/fa";
import { LuRefreshCcwDot } from "react-icons/lu";

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
  const lastAnswerRef = useRef(null);
  const lastPRef = useRef(null);

  useEffect(() => {
    // Scroll to the last <p> tag when history updates
    if (lastPRef.current && history.length > 0) {
      lastPRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [history]);

  useEffect(() => {
    // Scroll to the last answer only when a new item is added to the history
    if (lastAnswerRef.current && history.length > 0) {
      const lastItem = history[0]; // The last added item in the reversed history
      if (expandedAnswer === lastItem.answer) {
        lastAnswerRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  }, [history]);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          "https://toolbox.boomlive.in/api_project/indiaspendtemp.php?pulljson=true",
          { method: "GET", headers: { "Content-Type": "application/json" } }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch questions");
        }

        const data = await response.json();
        const cleanedQuestions = data.latest_json.questions.map(cleanQuestion);
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
  const renderSources = (itemSources) => {
    if (itemSources.length === 0) {
      return null;
    }

    return (
      <ul>
        {itemSources.map((source, index) => (
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

  const answerRefs = useRef({});

  useEffect(() => {
    // Scroll to the expanded answer when it changes
    if (expandedAnswer && answerRefs.current[expandedAnswer]) {
      answerRefs.current[expandedAnswer].scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [expandedAnswer]);

  return (
    <>
      <main className="trending-questions">
        {/* {history.length > 0 && (
          <div className="history-section">
            <div className="history-list">
              <ul className="history-items">
                {[...history].reverse().map((item, index) => (
                  <li
                    key={index}
                    className={`history-card ${
                      expandedAnswer === item.answer ? "expanded" : ""
                    }`}
                  >
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

                        {expandedAnswer === item.answer && (
                          <div className="sources-section">
                            <h4>Sources:</h4>
                            {renderSources()}
                          </div>
                        )}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )} */}
        {history.length > 0 && (
          <div className="history-section">
            <div className="history-list">
              <ul className="history-items">
                {[...history].reverse().map((item, index, array) => (
                  <li
                    key={index}
                    className={`history-card ${
                      expandedAnswer === item.answer ||
                      index === array.length - 1
                        ? "expanded"
                        : ""
                    }`}
                    ref={index === array.length - 1 ? lastAnswerRef : null}
                  >
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
                      {/* <p
                        className="answer-preview"
                        ref={index === 0 ? lastPRef : null} // Ref for the last <p>
                      >
                        <ReactMarkdown>
                          {expandedAnswer === item.answer ||
                          index === array.length - 1
                            ? item.answer
                            : `${item.answer.substring(0, 250)}...`}
                        </ReactMarkdown>
                        {(expandedAnswer === item.answer ||
                          index === array.length - 1) && (
                          <div className="sources-section">
                            {renderSources(item.sources)}
                          </div>
                        )}
                      </p> */}
                      <p
                        className="answer-preview"
                        ref={index === 0 ? lastPRef : null}
                      >
                        <ReactMarkdown>
                          {expandedAnswer === item.answer ||
                          index === array.length - 1
                            ? item.answer
                            : `${item.answer.substring(0, 250)}...`}
                        </ReactMarkdown>
                        {(expandedAnswer === item.answer ||
                          index === array.length - 1) && (
                          <div className="sources-section">
                            {renderSources(item.sources)}
                          </div>
                        )}{" "}
                        <div className="expand-container">
                          <div
                            className="text-expand-rk"
                            onClick={() =>
                              setExpandedAnswer(
                                expandedAnswer === item.answer
                                  ? null
                                  : item.answer
                              )
                            }
                          >
                            <div className="expand-answer-icon">
                              {expandedAnswer === item.answer ? (
                                <FaLongArrowAltUp size={20} />
                              ) : (
                                <FaLongArrowAltDown size={20} />
                              )}
                            </div>
                            <div className="expand-text-rk">
                              <span className="expand-toggle">
                                {expandedAnswer === item.answer
                                  ? "Collapse"
                                  : "Expand"}
                              </span>
                            </div>
                          </div>
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
              <div className="skeleton-item"></div>
            </div>
          </div>
        ) : selectedQuestion ? (
          <div></div>
        ) : (
          // <div className="question-full-answer">
          //   <div className="question-content">
          //     <div className="question-icon">
          //       <FcVoicePresentation />
          //     </div>
          //     <h3 className="question-text">{selectedQuestion}</h3>
          //   </div>
          //   <div className="answer-content">
          //     <div className="answer-icon">
          //       <FcReading />
          //     </div>
          //     <p className="answer-full">
          //       <ReactMarkdown>{answer}</ReactMarkdown>
          //       <div className="sources-section">
          //         <h4>Sources:</h4>
          //         {renderSources()}
          //       </div>
          //     </p>
          //   </div>
          // </div>

          <div className="questions-grid">
            <div className="tren-q-tit">
              <h2>Trending Questions</h2>
            </div>
            <div></div>
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
            <div></div>
            <div className="refresh-section" onClick={handleRefresh}>
              <div className="ref-txt-rk"> Refresh </div>
              <div className="answer-icon refreshingrk">
                <LuRefreshCcwDot size={30} />
              </div>
            </div>
            {/* <div className="question-tt-title">
              <h3>Where Facts Meet Your Questions</h3>
            </div> */}
          </div>
        )}
        {/* <div className="footer-sectionrk"> */}
        <Footer onSubmitQuestion={handleQuestionClick} />
        {/* </div> */}
      </main>
    </>
  );
}

export default TrendingQuestions;
