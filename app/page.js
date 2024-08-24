"use client";
import { Box, Button, Typography } from "@mui/material";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const chatbotOpen = () => {
    router.push("/ChatPage");
  };

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
