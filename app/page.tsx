"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaSpinner } from "react-icons/fa";
import AvatarImage1 from "../public/avatar1.png";
import AvatarImage2 from "../public/avatar2.png";
import AvatarImage3 from "../public/avatar3.png";
import AvatarImage4 from "../public/avatar4.png";
import SnackbarNotification from "@/components/snackbar";
import { format, formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

interface IChatSession {
  id: number;
  name: string;
  messages: IMessage[];
  message_count: number;
  role?: string;
}

interface IMessage {
  id: number;
  content: string;
  action: "USER" | "AI";
  timestamp: string;
}

const CHAT_API_URL =
  "https://admin-backend-docker-india-306034828043.asia-south2.run.app/nlp/api/chat_sessions";

const avatars = [AvatarImage1, AvatarImage2, AvatarImage3, AvatarImage4];

const MessagingInterface: React.FC = () => {
  const [chatSessions, setChatSessions] = useState<IChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<IMessage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPageCount, setTotalPageCount] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSnackbarVisible, setSnackbarVisible] = useState(false);
  const [isLoadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const loadChatSessions = useCallback(async (nextPage: number = 1) => {
    try {
      setLoadingMore(true);
      const response = await fetch(
        `${CHAT_API_URL}?page=${nextPage}&per_page=20`
      );
      if (!response.ok) {
        throw new Error("Unable to fetch sessions. Please try again.");
      }
      const data = await response.json();

      const sortedChatSessions = data.chat_sessions.sort(
        (a: IChatSession, b: IChatSession) => {
          const aLatestMsg = a.messages[0]?.timestamp || new Date(0);
          const bLatestMsg = b.messages[0]?.timestamp || new Date(0);
          return (
            new Date(bLatestMsg).getTime() - new Date(aLatestMsg).getTime()
          );
        }
      );

      setChatSessions((prev) => [...prev, ...sortedChatSessions]);
      setTotalPageCount(data.total_pages || null);
      setCurrentPage((prev) => prev + 1);
    } catch (error: any) {
      setErrorMessage(error.message);
      setSnackbarVisible(true);
    } finally {
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadChatSessions();
  }, [loadChatSessions]);

  const loadMoreSessions = () => {
    if (totalPageCount && currentPage <= totalPageCount) {
      loadChatSessions(currentPage);
    }
  };

  const lastChatSessionElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (totalPageCount !== null && currentPage > totalPageCount) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          loadChatSessions();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [loadChatSessions, totalPageCount, currentPage]
  );

  const onSessionSelect = useCallback(
    (sessionId: number) => {
      const selectedSession = chatSessions.find(
        (session) => session.id === sessionId
      );
      if (selectedSession) {
        setActiveSession(sessionId);
        setChatMessages(selectedSession.messages);
      }
    },
    [chatSessions]
  );

  const getSessionTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return `${formatDistanceToNow(date, { addSuffix: true })}`;
  };

  const getMessageTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return `Today ${format(date, "HH:mm")}`;
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const onBackClick = () => {
    setActiveSession(null);
  };

  return (
    <div className="flex h-screen flex-col md:flex-row bg-gray-50 font-sans">
      <SnackbarNotification
        message={errorMessage || ""}
        isVisible={isSnackbarVisible}
        onClose={() => setSnackbarVisible(false)}
      />
      <div className="w-full md:w-1/3 lg:w-1/4 bg-white border-r overflow-hidden flex flex-col">
        <div className="border-b bg-white flex items-center justify-center p-4">
          <h1 className="text-2xl font-semibold text-gray-600">Messaging</h1>
        </div>
        <div className="flex-grow overflow-y-auto">
          {chatSessions.map((session, index) => (
            <div
              key={session.id}
              ref={
                index === chatSessions.length - 1
                  ? lastChatSessionElementRef
                  : null
              }
              className={`flex items-center p-4 hover:bg-blue-50 transition duration-200 cursor-pointer rounded-md ${
                activeSession === session.id ? "bg-blue-200" : ""
              } border-b border-gray-200`}
              onClick={() => onSessionSelect(session.id)}
            >
              <div className="w-12 h-12 rounded-full bg-orange-300 flex items-center justify-center overflow-hidden">
                <Image
                  src={avatars[session.id % 4]}
                  alt={session.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="ml-4 flex-grow">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session.name}
                </p>
                <p className="text-xs text-gray-500">
                  {session.role ||
                    (session.messages.length > 0 &&
                      getSessionTimestamp(session.messages[0].timestamp))}
                </p>
              </div>
            </div>
          ))}
          {totalPageCount && currentPage <= totalPageCount && (
            <div className="flex justify-center items-center py-4">
              <button
                onClick={loadMoreSessions}
                className="flex items-center bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200"
              >
                {isLoadingMore ? (
                  <FaSpinner className="animate-spin mr-2" />
                ) : (
                  "Load More"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-gray-50">
        {activeSession && (
          <>
            <div className="flex items-center p-4 border-b bg-white fixed w-full">
              <ArrowLeft
                className="md:hidden mr-2 cursor-pointer"
                onClick={onBackClick}
              />
              <Image
                src={
                  avatars[
                    chatSessions.find((s) => s.id === activeSession)?.id! % 4
                  ]
                }
                alt="User Icon"
                className="size-10 object-cover"
              />
              <h2 className="ml-3 text-xl font-semibold text-gray-800">
                {chatSessions.find((s) => s.id === activeSession)?.name}
              </h2>
            </div>
            <div className="flex-grow overflow-y-auto p-4 pt-24 h-screen">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-4 flex flex-col ${
                    message.action === "USER" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.action === "USER"
                        ? "bg-[#2E3B5B] text-white"
                        : "bg-[#000929] text-white"
                    }`}
                  >
                    {message.content}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {getMessageTimestamp(message.timestamp)}
                  </p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessagingInterface;
