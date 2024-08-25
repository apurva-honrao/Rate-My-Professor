"use client";
import { Box, Button, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import TextField from "@mui/material/TextField";

export default function Home() {
  const router = useRouter();

  const chatbotOpen = () => {
    router.push("/ChatPage");
  };

  const [results, setResults] = useState(null);
  const [url, setUrl] = useState("");
  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  };

  async function getTest() {
    const response = await fetch("/api/scraper", {
      method: "POST",
      body: JSON.stringify({ url }),
    }).then((res) => res.json());
    setResults(response);
  }

  return (
    <Box
      width="100%"
      height="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
    >
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        spacing={2}
        zIndex={1}
      >
        <Typography variant="h3" mb={2} color="white">
          Welcome to ProfTips!
        </Typography>
        <Box width="fit-content" onClick={chatbotOpen}>
          <Button variant="contained">Chat with bot</Button>
        </Box>
      </Box>
    </Box>
  );
}
