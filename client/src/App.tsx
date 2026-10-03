import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { MotionConfig } from "motion/react";
import { BrowserRouter, Route, Routes } from "react-router";
import { HomePage } from "./pages/HomePage";
import { RoomPage } from "./pages/RoomPage";

export function App() {
  return (
    <MantineProvider defaultColorScheme="auto">
      <Notifications />
      <ModalsProvider>
        <MotionConfig reducedMotion="user">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/r/:roomId" element={<RoomPage />} />
            </Routes>
          </BrowserRouter>
        </MotionConfig>
      </ModalsProvider>
    </MantineProvider>
  );
}
