import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "mantine-contextmenu/styles.css";
import "./contextMenu.css";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { ContextMenuProvider } from "mantine-contextmenu";
import { MotionConfig } from "motion/react";
import { BrowserRouter, Route, Routes } from "react-router";
import { HomePage } from "./pages/HomePage";
import { RoomPage } from "./pages/RoomPage";
import { MENU_RADIUS, theme } from "./theme";

export function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Notifications />
      <ModalsProvider>
        {/* A menu lies above the panels, so it has the stronger shadow of all menus. */}
        <ContextMenuProvider shadow="md" borderRadius={MENU_RADIUS}>
          <MotionConfig reducedMotion="user">
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/r/:roomId" element={<RoomPage />} />
              </Routes>
            </BrowserRouter>
          </MotionConfig>
        </ContextMenuProvider>
      </ModalsProvider>
    </MantineProvider>
  );
}
