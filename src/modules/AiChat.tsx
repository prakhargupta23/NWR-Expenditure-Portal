import React, { useEffect, useState } from "react";
import {
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  IconButton,
  InputAdornment,
  Box,
  Divider,
} from "@mui/material";
import "../Home.css";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import {
  Search,
  Send,
  Mic,
  VideoCameraBack,
  ChatBubbleOutline,
} from "@mui/icons-material";
import { aiService } from "../services/ai.service";
import { csvService } from "../services/csv.service";
import axios from "axios";
import { marked } from "marked";
import DOMPurify from "dompurify";
import parse from "html-react-parser";
import { set } from "lodash";
import { motion } from "framer-motion";
import { userInfo } from "os";
import { generatePrompt } from "../utils/otherUtils";

// const suggestions = [
//   "Show total unlinked payments for last month",
//   "Show total unlinked payments for last month",
//   "Show total unlinked payments for last month",
//   "Show total unlinked payments for last month",
// ];
const chatIcon = require("../assets/chaticon.png");
export default function ChatInterface({ fullNavBar, pageNmae }: any) {
  const [messages, setMessages] = useState<object[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [threadId, setThreadId] = useState();

  useEffect(() => {
    console.log("this is messages");
    console.log(messages);
  }, [messages]);
  const fetchSqlData = async (
    messages: object[],
    apiUrl: string,
    apiKey: string
  ) => {
    var sqlData = null;
    let promptData = generatePrompt(fullNavBar);
    try {
      const body = {
        response_format: { type: "json_object" },
        messages: [promptData, ...messages],
      };

      const response = await axios.post(`${apiUrl}`, body, {
        headers: { "Content-Type": "application/json", "api-key": apiKey },
      });

      if (response.status === 200) {
        // Extract structured JSON SQL response
        const jsonSql = response.data?.choices?.[0]?.message?.content;

        if (jsonSql == null) {
          return sqlData;
        }

        const formattedSqlJson = JSON.parse(jsonSql);

        // Check if the query is null
        if (formattedSqlJson.query !== null) {
          const queryResponse = await csvService.getQueryData(formattedSqlJson);

          if (queryResponse.success === true) {
            sqlData = queryResponse.data;
          }
        }
      }

      return sqlData;
    } catch (error: any) {
      console.log(error.message);

      return sqlData;
    }
  };

  useEffect(() => {
    aiService.fetchGptDetails().then((gptDetails) => {
      if (gptDetails.success === false) {
        return;
      }

      setApiKey(gptDetails.data.apiKey);
      setApiUrl(gptDetails.data.apiUrl);
    });
  }, []);

  const fetchGPTResponse = async (conversation: object[]) => {
    setLoading(true);

    try {
      const sqlData = await fetchSqlData(conversation, apiUrl, apiKey);

      // Pass the formatted message to GPT for better display
      const gptBody = {
        messages: [
          {
            role: "system",
            content: `- You are an AI assistant providing formatted responses.
                     - based on the data provided to you continue the conversation `,
          },
          {
            role: "user",
            content: JSON.stringify({
              sqlData,
            }),
          },
          ...conversation,
        ],
      };

      const gptResponse = await axios.post(`${apiUrl}`, gptBody, {
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
      });

      if (gptResponse.status === 200) {
        const formattedDataMessage =
          gptResponse.data?.choices?.[0]?.message?.content;

        const structuredMessage = marked(formattedDataMessage);

        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: "assistant",
            content: structuredMessage,
          },
        ]);
      } else {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: "assistant",
            content: "Sorry, I am unable to process your request",
          },
        ]);
      }
    } catch (error: any) {
      console.log(error.message);

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
          content: "Sorry, I am unable to process your request",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchGPTAssistantResponse = async (query: string) => {
    setLoading(true);

    try {
      const chatResponse = await aiService.getChatResponse(
        query,
        pageNmae,
        threadId
      );

      if (chatResponse.success == true) {
        const structuredMessage = marked(chatResponse.data.reply);
        const replyImage = chatResponse.data.image;

        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: "assistant",
            content: structuredMessage,
            image: replyImage,
          },
        ]);

        if (chatResponse.data.thread_id)
          setThreadId(chatResponse.data.thread_id);
      } else {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: "assistant",
            content: "Sorry, I am unable to process your request",
          },
        ]);
      }
    } catch (error: any) {
      console.log(error.message);

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
          content: "Sorry, I am unable to process your request",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (input.trim()) {
      var currentMessages = messages;
      var newMessages = currentMessages.concat({
        role: "user",
        content: input,
      });
      setMessages(newMessages);
      fetchGPTAssistantResponse(input);
      setInput("");
    }
  };
  return (
    <>
      <Box
        sx={{
          width: "100%",
        }}
      >

      <img
            src={require("../assets/degreemasterlogo.png")}
            style={{ width: 110, marginTop: "5px", marginBottom:"5px" , marginLeft: "100px",float: "right"}}
            alt="Arrow" 
          />

        <Box
          sx={{
            background: "linear-gradient(90deg, #7B2FF7, #9F44D3)",
            color: "white",
            textAlign: "center",
            padding: "10px 20px",
            width: "fit-content",
            borderRadius: "12px 12px 0 0", // Updated border-radius
            position: "relative",
            boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
            marginLeft: "5px", // Left-aligned
            marginTop: "10px",

          }}
        >
        
          <Typography
            variant="body1"
            fontWeight="500"
            sx={{
              fontFamily: "MyCustomFont,SourceSerif4_18pt",
              fontSize: "16PX",
              marginTop: "5px",
            }}
          >
            Your AI Assistant
          </Typography>
          <Box
            sx={{
              width: "30px",
              height: "3px",
              backgroundColor: "white",
              borderRadius: "5px",
              margin: "auto",
              marginTop: "5px",
            }}
          />
        </Box>
      </Box>
      <Box
        sx={{
          position: "absolute",
          width: "100%",
          height: "100%",
          top: 0,
          left: 0,
          background:
            "radial-gradient(137.56% 745.22% at 27.41% 80%, #7328EB 0%, #B72BF8 100%)",
          filter: "blur(100px)", // Adjust blur intensity (600px is too strong)
          zIndex: -1, // Place behind the Paper
        }}
      />
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          borderRadius: "12px",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "rgba(56, 38, 96, 0.7)", // Slight transparency to show the blur
          border: "1px solid #B72BF8",
          position: "relative", // Ensure it stays above the blurred background
        }}
      >
        <Grid container sx={{ height: "100%", flex: 1 }}>
          <Grid
            item
            xs={12}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              paddingLeft: 2,
              paddingRight: 2,
              height: "100%", // Keeps grid static
            }}
          >
            {/* If No Messages */}
            {messages.length === 0 && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1, // Ensures it takes up full available space

                  width: "100%",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "700",
                    color: "#fff",
                    fontFamily: "MyCustomFont,SourceSerif4_18pt",
                  }}
                >
                  What would you like to know?
                </Typography>
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#fff",
                    mt: 1,
                    fontFamily: "MyCustomFont,SourceSerif4_18pt",
                  }}
                >
                  Ask me anything regarding the available data and <br /> I will
                  help answer to the best of my capabilities.
                </Typography>

                {/* Input Field in the Middle */}
                <Box
                  sx={{
                    width: { lg: "95%", md: 400, sm: 300 },
                    mt: 4,
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#36314f", // Dark background
                    borderRadius: "12px",
                    height: "49px",
                    padding: "6px 12px",
                    border: "1px solid rgba(255, 255, 255, 0.3)", // Add subtle border
                  }}
                >
                  {/* Left Icon Outside the Inner Box */}
                  <ChatBubbleOutline
                    sx={{ color: "#A1A1A1", fontSize: "18px", mr: 1 }}
                  />

                  {/* Inner Box with an extra border around TextField */}

                  <TextField
                    fullWidth
                    placeholder="Ask anything"
                    value={input}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSendMessage();
                      }
                    }}
                    onChange={(e) => setInput(e.target.value)}
                    variant="outlined"
                    sx={{
                      backgroundColor: "#191F2A",
                      borderRadius: "8px", // Rounded corners
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        "&:hover fieldset": {
                          borderColor: "#FFFFFF",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#B72BF8", // Focus color (Purple)
                        },
                      },
                      "& .MuiInputBase-input": {
                        padding: "6px 12px",
                        fontSize: "14px",
                        color: "#FFFFFF",
                      },
                    }}
                  />

                  {/* Right Send Button Outside the Inner Box */}
                  <IconButton
                    onClick={handleSendMessage}
                    sx={{
                      backgroundColor: "#B72BF8",
                      color: "#fff",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      ml: 1, // Adds space between TextField and button
                      "&:hover": { backgroundColor: "#9B24D1" },
                    }}
                  >
                    <Send sx={{ fontSize: "18px" }} />
                  </IconButton>
                </Box>

                {/* Suggestion Buttons */}
                {/* <Grid container spacing={2} mt={2} justifyContent="center">
                {suggestions.map((text, index) => (
                  <Grid item xs={5.5} key={index}>
                    <Button
                      fullWidth
                      variant="outlined"
                      sx={{
                        borderRadius: "8px",
                        textTransform: "none",
                        fontSize: "12px",
                        fontWeight: "500",
                        color: "#404040",
                        borderColor: "#A8A8A8",
                        boxShadow: "none",
                        "&:hover": {
                          backgroundColor: "#F6EFFD",
                        },
                        backgroundColor: "#E2E2E2",
                      }}
                    >
                      {text}
                    </Button>
                  </Grid>
                ))}
              </Grid> */}
              </Box>
            )}

            {/* Chat Messages Section */}
            {messages.length > 0 && (
              <Box
                sx={{
                  width: "100%",

                  flexGrow: 1,
                  height: "70%", // Set a fixed height for the chat section
                  overflowY: "auto", // Scroll only in chat messages
                  padding: "16px",
                  maxHeight: "420px",
                  backgroundColor: "#382660",

                  borderTopRightRadius: "12px",
                  borderTopLeftRadius: "12PX",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {messages.map((msg: any, index) => (
                  <>
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent:
                          msg.role === "user" ? "flex-end" : "flex-start",

                        marginBottom: "10px",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column", // stack children vertically
                          alignItems:
                            msg.role === "user" ? "flex-end" : "flex-start",
                          marginBottom: "16px", // spacing between messages
                        }}
                      >
                        {msg.role !== "user" && (
                          <IconButton
                            sx={{
                              backgroundColor: "#1E1E2E",
                              color: "white",
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.3)",
                              marginLeft: "0px",
                              marginBottom: "6px",
                              "&:hover": {
                                backgroundColor: "#29293A",
                              },
                            }}
                          >
                            <img
                              src={require("../assets/robot.png")}
                              alt="Robot Icon"
                            />
                          </IconButton>
                        )}

                        <Typography
                          sx={{
                            padding: "10px",
                            backgroundColor:
                              msg.role === "user" ? "#1e2032" : "#2a2249",
                            color: "#fff",
                            borderRadius: "10px",
                            maxWidth: "100%",
                            wordWrap: "break-word",
                            whiteSpace: "pre-wrap",
                            textAlign: "left",
                            lineHeight: "1.2",
                            fontFamily: "MyCustomFont,SourceSerif4_18pt",
                            overflowWrap: "break-word",
                            wordBreak: "break-word",
                          }}
                        >
                          {parse(DOMPurify.sanitize(msg.content))}
                        </Typography>

                        {msg.image && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "center",
                              width: "100%",
                              marginTop: "10px",
                            }}
                          >
                            <img
                              src={`data:image/png;base64,${msg.image}`}
                              alt="Base64"
                              style={{
                                width: "100%",
                                borderRadius: "8px",
                              }}
                            />
                          </Box>
                        )}
                      </Box>

                      {msg.role === "user" ? (
                        <IconButton
                          sx={{
                            backgroundColor: "#1E1E2E",
                            color: "white",
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.3)",
                            marginLeft: msg.role === "user" ? "10px" : "0px", // Add space when needed
                            marginRight: msg.role !== "user" ? "10px" : "0px", // Space on the left for non-user messages
                            "&:hover": {
                              backgroundColor: "#29293A",
                            },
                          }}
                        >
                          <AccountCircleIcon sx={{ fontSize: "20px" }} />
                        </IconButton>
                      ) : null}
                    </Box>
                  </>
                ))}

                {loading && (
                  <Box
                    sx={{ display: "flex", alignItems: "center", mb: "10px" }}
                  >
                    <Typography sx={{ color: "gray", fontStyle: "italic" }}>
                      AI is typing
                    </Typography>
                    <Box sx={{ display: "flex", ml: "5px" }}>
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                          style={{
                            fontSize: "1.2rem",
                            margin: "0 2px",
                            color: "gray",
                          }}
                        >
                          •
                        </motion.span>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            {/* Input Field at the Bottom */}
            {messages.length > 0 && (
              <Box
                sx={{
                  width: { lg: "95%", md: 400, sm: 300 },
                  mt: 4,
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "#36314f", // Dark background
                  borderRadius: "12px",
                  height: "49px",
                  padding: "6px 12px",
                  border: "1px solid rgba(255, 255, 255, 0.3)", // Add subtle border
                }}
              >
                {/* Left Icon Outside the Inner Box */}
                <img
                  src={require("../assets/robot.png")}
                  style={{ marginRight: "1%" }}
                />

                {/* Inner Box with an extra border around TextField */}

                <TextField
                  fullWidth
                  placeholder="Ask anything"
                  value={input}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSendMessage();
                    }
                  }}
                  onChange={(e) => setInput(e.target.value)}
                  variant="outlined"
                  sx={{
                    backgroundColor: "#191F2A",
                    borderRadius: "8px", // Rounded corners
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      "&:hover fieldset": {
                        borderColor: "#FFFFFF",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#B72BF8", // Focus color (Purple)
                      },
                    },
                    "& .MuiInputBase-input": {
                      padding: "6px 12px",
                      fontSize: "14px",
                      color: "#FFFFFF",
                    },
                  }}
                />

                {/* Right Send Button Outside the Inner Box */}
                <IconButton
                  onClick={handleSendMessage}
                  sx={{
                    background: "linear-gradient(90deg, #7B2FF7, #9F44D3)",
                    color: "#fff",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    ml: 1, // Adds space between TextField and button
                    "&:hover": { backgroundColor: "#9B24D1" },
                  }}
                >
                  <Send sx={{ fontSize: "18px" }} />
                </IconButton>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
      <Box
        sx={{
          width: "100%",
          mb: 3,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          marginTop: 0.5,
          alignItems: "flex-end", // align the whole content to the right
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center", // center text and image relative to each other,
          }}

        >
          
        </Box>

      </Box>

      <Box />
    </>
  );
}
