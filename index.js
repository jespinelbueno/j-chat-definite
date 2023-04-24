require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pg = require("pg");
const { Pool } = pg;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const path = require("path");
const app = express();
const port = process.env.PORT || 3001;

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
}

const devConfig = {
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  port: process.env.PG_PORT,
};

const devConfig2={
  connectionString: process.env.DATABASE_URL
}

const proConfig = {
  connectionString: process.env.DATABASE_URL
}

const pool = new Pool(process.env.NODE_ENV === 'production' ? proConfig : devConfig);


app.use(cors());
app.use(express.json());

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.error("Error verifying token:", err);
        return res.sendStatus(403);
      }

      if (user) {
        const payload = user;
        req.userId = payload.id;
        next();
      } else {
        res.sendStatus(401);
      }
    });
  } else {
    res.sendStatus(401);
  }
};

// Add your API routes here

app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, avatar_url FROM users"
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error AAA" });
  }
});

app.get("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await pool.query(
      "SELECT id, username, email, avatar_url FROM users WHERE id = $1",
      [id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

async function fetchAvatar() {
  try {
    const response = await axios.get(
      "https://tinyfac.es/api/data?limit=50&quality=0"
    );
    const images = response.data;

    // Choose a random avatar from the images array
    const avatar = images[Math.floor(Math.random() * images.length)];

    return avatar;
  } catch (error) {
    console.error("Error fetching avatar:", error);
    return null;
  }
}

app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );

    if (parseInt(result.rows[0].count, 10) > 0) {
      return res
        .status(409)
        .json({ message: "Username or email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Fetch avatar URL
    const avatarUrl = await fetchAvatar();

    // Check if avatar URL was fetched successfully
    if (!avatarUrl) {
      return res.status(500).json({ message: "Error fetching avatar" });
    }

    await pool.query(
      "INSERT INTO users(username, email, password, avatar_url) VALUES($1, $2, $3, $4)",
      [username, email, hashedPassword, avatarUrl]
    );

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT id, username, password FROM users WHERE username = $1",
      [username]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/messages", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM messages ORDER BY timestamp ASC"
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/messages/:recipient_id", authenticateJWT, async (req, res) => {
  const sender_id = req.userId;

  const recipient_id = req.params.recipient_id;

  if (!recipient_id) {
    res.status(400).json({ message: "Invalid recipient ID" });
    return;
  }

  try {
    const result = await pool.query(
      "SELECT * FROM messages WHERE (sender_id = $1 AND recipient_id = $2) OR (sender_id = $2 AND recipient_id = $1) ORDER BY timestamp ASC",
      [sender_id, recipient_id]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/messages", async (req, res) => {
  const { sender_id, content, recipient_id } = req.body;

  try {
    await pool.query(
      "INSERT INTO messages(content, sender_id, recipient_id) VALUES($1, $2, $3)",
      [content, sender_id, recipient_id]
    );

    res.status(201).json({ message: "Message sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build/index.html"));
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
