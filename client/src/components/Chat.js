import React, { useEffect, useState } from "react";
import axios from "axios";
import "./styles/Chat.css";
import NavBar from "./NavBar";
import jwtDecode from "jwt-decode";

const Chat = () => {
  const [newMessage, setNewMessage] = useState("");
  const userString = localStorage.getItem("user");
  const currentUserId = userString ? JSON.parse(userString).id : null;

  const [messagesWithUsernames, setMessagesWithUsernames] = useState([]);
  const [recipientId, setRecipientId] = useState(null);
  const [users, setUsers] = useState([]);
  const [displayCount, setDisplayCount] = useState(2); // Initial number of users to display

  const handleShowMore = () => {
    // Increase the number of users to display by a certain amount
    setDisplayCount(displayCount + 2);
  };

  const [currentUser, setCurrentUser] = useState(null);

  const token = localStorage.getItem("token");
  const usersCache = {};

  let decodedToken = null;
  let username = null;

  if (token) {
    try {
      decodedToken = jwtDecode(token);
      username = decodedToken.username;
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  }

  const fetchCurrentUser = async () => {
    const response = await axios.get(
      `https://juandi-chat-backend.vercel.app/api/users/${currentUserId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    setCurrentUser({
      ...response.data,
      avatar_url: JSON.parse(response.data.avatar_url).url,
    });
  };

  const fetchUsers = async () => {
    const response = await axios.get(
      "https://juandi-chat-backend.vercel.app/api/users",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const allUsers = response.data
      .filter((user) => user.id !== currentUserId) // Filter out the current user
      .map((user) => {
        return {
          ...user,
          avatar_url: JSON.parse(user.avatar_url).url, // Parse the JSON string and extract the URL
        };
      });
    setUsers(allUsers);
  };

  const getUsernameById = async (id) => {
    if (!id) {
      console.warn("Invalid ID passed to getUsernameById:", id);
      return "Unknown";
    }

    if (usersCache[id]) {
      return usersCache[id];
    }

    try {
      const response = await axios.get(
        `https://juandi-chat-backend.vercel.app/api/users/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const username = response.data.username;
      usersCache[id] = username;
      return username;
    } catch (error) {
      console.error("Error fetching username:", error.message);
      return "Unknown";
    }
  };

  const fetchMessages = async () => {
    console.log("Fetching messages for recipient:", recipientId);
    if (!recipientId) {
      return;
    }

    const response = await axios.get(
      `https://juandi-chat-backend.vercel.app/api/messages/${recipientId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const messagesWithUsernamesPromises = response.data.map(async (message) => {
      const username = await getUsernameById(message.sender_id);
      const userAvatarJson =
        users.find((user) => user.id === message.sender_id)?.avatar_url || "{}"; // Fetch avatar_url for the sender as a JSON string
      let avatar_url = "";
      try {
        const userAvatar = JSON.parse(userAvatarJson);
        avatar_url = userAvatar.url || "";
      } catch (error) {
        console.error("Error parsing user avatar JSON:", error);
      }
      return { ...message, username, avatar_url }; // Include avatar_url
    });

    const messagesWithUsernames = await Promise.all(
      messagesWithUsernamesPromises
    );
    setMessagesWithUsernames(messagesWithUsernames);
  };

  const getRecipientName = (recipientId) => {
    const recipient = users.find((user) => user.id === recipientId);
    return recipient ? recipient.username : "Unknown User";
  };

  const getRecipientAvatar = () => {
    const recipient = users.find((user) => user.id === recipientId);
    return recipient ? recipient.avatar_url : "Unknown Avatar";
  };

  const sendMessage = async () => {
    if (newMessage.trim() === "") {
      return;
    }

    const timestamp = new Date().getTime(); // Move timestamp creation here
    const timestampNumber = parseInt(timestamp, 10);

    // Obtain the sender_id from the UserContext or localStorage
    const userString = localStorage.getItem("user");
    if (!userString) {
      console.error("User not found in localStorage");
      return;
    }

    const currentUser = JSON.parse(userString);
    const sender_id = currentUser.id;

    if (!sender_id) {
      console.error("sender_id not found in currentUser:", currentUser);
      return;
    }

    await axios.post(
      "https://juandi-chat-backend.vercel.app/api/messages", // Include recipient_id here
      { content: newMessage, sender_id, recipient_id: recipientId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setNewMessage("");
    fetchMessages();
  };

const handleUserSelection = (userId) => {
  console.log("Recipient selected:", userId);
  setRecipientId(userId);
};

useEffect(() => {
  fetchUsers();
  fetchCurrentUser();
}, []);

useEffect(() => {
  if (recipientId !== null) {
    fetchMessages();
  }
}, [recipientId]);

  return (
    <div className='chat-container'>
      <NavBar></NavBar>
      {username && (
        <p>
          Welcome,{" "}
          <strong>
            {username.charAt(0).toUpperCase() + username.slice(1)}
          </strong>
          ! Who are you wanting to chat with?
        </p>
      )}

      <div className='user-container'>
        <div className='users'>
          <ul>
            {users.slice(0, displayCount).map((user) => (
              <button
                className='user-button'
                key={user.id}
                onClick={() => handleUserSelection(user.id)}
              >
                {user.username.length > 6
                  ? `${
                      user.username.charAt(0).toUpperCase() +
                      user.username.slice(1, 6)
                    }...`
                  : `${
                      user.username.charAt(0).toUpperCase() +
                      user.username.slice(1)
                    }`}
              </button>
            ))}
          </ul>
          {displayCount < users.length && ( // Display "Show More" button if there are more users
            <button className='show-more-button' onClick={handleShowMore}>
              Show More
            </button>
          )}
        </div>
      </div>

      <br />
      {recipientId ? (
        <>
          <div className='chatting-with'>
            <p>
              You are chatting with:{" "}
              <strong>
                {getRecipientName(recipientId).charAt(0).toUpperCase() +
                  getRecipientName(recipientId).slice(1)}
              </strong>
            </p>
            <img src={getRecipientAvatar()} alt='' />
            {console.log(getRecipientAvatar())}
          </div>
          <div className='message-container'>
            {messagesWithUsernames.length > 0 ? (
              messagesWithUsernames.map((message) => {
                const user = users.find(
                  (user) => user.id === message.sender_id
                );
                const avatarUrl = user?.avatar_url || "";
                return (
                  <div
                    key={message.id}
                    className={`message-row ${
                      message.sender_id === currentUserId
                        ? "user-row"
                        : "other-user-row"
                    }`}
                  >
                    <img
                      src={
                        message.sender_id === currentUserId
                          ? currentUser.avatar_url
                          : avatarUrl
                      }
                      className='avatar'
                      alt={`${message.username}'s avatar`}
                      title={`${message.username}'s avatar`}
                    />
                    <div
                      className={`message-bubble ${
                        message.sender_id === currentUserId
                          ? "user-message-bubble"
                          : ""
                      }`}
                    >
                      {message.content}
                      <span className='timestamp'>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className='no-messages'>
                <p className='no-messages-title'>
                  No messages between users :(
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className='select-user-message'>
          <h4>Select a user to start chatting</h4>
        </div>
      )}

      <br />
      <div className='input-and-send'>
        <input
          className='message-input'
          type='text'
          placeholder=' Type your message here'
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />

        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chat;
