import React, { useState } from "react";
import {
  Grid,
  Typography,
  Card,
  CardContent,
  CardActions,
  Collapse,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { sectionsForComment } from "../utils/staticDataUtis";

const CommentEditor = ({ data, setData }: any) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleExpand = (section: string) => {
    setExpanded((prev) => (prev === section ? null : section));
  };

  const handleContentChange = (value: string, tableName: string) => {
    setData((prevData: any) =>
      prevData.map((entry: any) =>
        entry.tableName === tableName ? { ...entry, content: value } : entry
      )
    );
  };

  return (
    <Grid container spacing={2} sx={{ marginTop: "12px" }}>
      {sectionsForComment.map((section) => {
        const isOpen = expanded === section;
        const currentContent =
          data.find((entry: any) => entry.tableName === section)?.content || "";

        return (
          <Grid item xs={12} key={section}>
            <Card
              sx={{
                backgroundColor: "#2A2A2A",
                color: "#fff",
                borderRadius: "10px",
              }}
            >
              <CardActions
                onClick={() => handleExpand(section)}
                sx={{
                  justifyContent: "space-between",
                  padding: "8px",
                  cursor: "pointer",
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "MyCustomFont,SourceSerif4_18pt",
                    fontSize: "18px",
                    color: "#fff",
                  }}
                >
                  {section}
                </Typography>
                <ExpandMoreIcon
                  sx={{
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.3s ease",
                    color: "#fff",
                  }}
                />
              </CardActions>
              <Collapse in={isOpen} timeout="auto" unmountOnExit>
                <CardContent>
                  <ReactQuill
                    value={currentContent}
                    onChange={(value) => handleContentChange(value, section)}
                    placeholder="Write something..."
                    theme="snow"
                    style={{
                      backgroundColor: "#1E1E1E",
                      color: "#fff",
                      borderRadius: "10px",
                      height: "120px",
                      marginBottom: "10px",
                    }}
                  />
                </CardContent>
              </Collapse>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default CommentEditor;
