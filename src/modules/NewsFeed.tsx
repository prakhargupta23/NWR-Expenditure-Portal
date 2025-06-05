import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

interface NewsItem {
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  link: string; // Added a link to each news item
}

const mockNews: NewsItem[] = [
  {
    title: "IRCTC Char Dham Yatra: Bharat Gaurav Deluxe Train Launch",
    summary:
      "IRCTC is launching a Char Dham Yatra from May 27, 2025, from Delhi Safdarjung, right after Badrinath Dham opens.",
    source: "ET Now",
    publishedAt: "May 4, 2025",
    link: "https://www.etnownews.com/infrastructure/irctc-char-dham-yatra-indian-railways-to-operate-bharat-gaurav-deluxe-ac-tourist-train-check-date-destinations-and-more-article-151558070",
  },
  {
    title: "Chhota Bheem Joins Railways to Promote Safety",
    summary:
      "Indian Railways teams up with 'Chhota Bheem' for a safety campaign, launched at the WAVES event in Mumbai.",
    source: "The Daily Pioneer",
    publishedAt: "May 4, 2025",
    link: "https://www.dailypioneer.com/2025/pioneer-exclusive/chhota-bheem-waves-safety-for-youngsters-on-indian-railways.html",
  },
  {
    title: "Mizoram’s Rail Connectivity: First Trial Run to Sairang",
    summary:
      "Northeast Frontier Railway conducts its first trial run to Sairang, marking a milestone for Mizoram’s rail connection.",
    source: "Swarajya Mag",
    publishedAt: "May 4, 2025",
    link: "https://swarajyamag.com/news-brief/mizoram-set-to-get-capital-rail-connectivity-as-northeast-frontier-railway-conducts-first-trial-run-to-aizawls-sairang",
  },
];

const NewsFeed: React.FC = () => {
  return (
    <Box
      sx={{
        background: "rgba(56, 38, 96, 0.9)",
        border: "1px solid #B72BF8",
        borderRadius: 2,
        height: "95%", // Full height of container
        display: "flex", // Enables layout stretching
        flexDirection: "column",
        overflow: "hidden", // Prevent scrollbars from escaping
        boxSizing: "border-box", // Ensures border is respected
      }}
    >
      <Box sx={{ py: 2, borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
        <Typography variant="h6" sx={{ textAlign: "center", color: "white" }}>
          News Feed
        </Typography>
      </Box>

      <List
        dense
        sx={{
          px: 1,
          overflowY: "auto",
          flex: 1, // <--- This makes List grow and allow scrolling
        }}
      >
        {mockNews.map((item, index) => (
          <React.Fragment key={index}>
            <ListItem alignItems="flex-start" sx={{ px: 0 }}>
              <Card
                sx={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  width: "100%",
                  boxShadow: "none",
                }}
              >
                <CardContent>
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    gutterBottom
                    color={"white"}
                    component="a" // Make title clickable
                    href={item.link} // Link to the news article
                    target="_blank" // Open in new tab
                    rel="noopener noreferrer" // Security best practice for external links
                    sx={{
                      textDecoration: "underline", // Adds underline to make it look like a link
                      color: "white",
                      cursor: "pointer", // Makes the cursor look like a hand on hover
                      "&:hover": {
                        color: "#B72BF8", // Changes color when hovered
                        textDecoration: "underline", // Ensures the underline stays on hover
                      },
                    }}
                  >
                    {item.title}
                  </Typography>

                  <Typography variant="body2" color="rgba(255,255,255,0.8)">
                    {item.summary}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      mt: 1,
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    {item.source} • {item.publishedAt}
                  </Typography>
                </CardContent>
              </Card>
            </ListItem>
            {index < mockNews.length - 1 && (
              <Divider sx={{ my: 1, borderColor: "rgba(255,255,255,0.1)" }} />
            )}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default NewsFeed;
