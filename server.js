require("dotenv").config();

const bodyParser = require("body-parser");
const pgp = require("pg-promise")();
const express = require("express");
const app = express();
const db = pgp({
  host: "localhost",
  port: 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD
});

app.use(bodyParser.json());

// app.get("/api/songs", function(req, res) {
//   db.any("SELECT * FROM song")
//     .then(function(data) {
//       res.json(data);
//     })
//     .catch(function(error) {
//       res.json({ error: error.message });
//     });
// });

app.get("/api/artists", function(req, res) {
  db.any("SELECT name FROM artist")
    .then(function(data) {
      res.json(data);
    })
    .catch(function(error) {
      res.json({ error: error.message });
    });
});

app.get("/api/songs", function(req, res) {
  db.any(
    "SELECT song.id, artist.name, song.title, song.year FROM artist, song WHERE artist.id = song.artist_id"
  )
    .then(function(data) {
      res.json(data);
    })
    .catch(function(error) {
      res.json({ error: error.message });
    });
});

app.get("/api/playlists", function(req, res) {
  db.any("SELECT id, name FROM playlist")
    .then(function(data) {
      res.json(data);
    })
    .catch(function(error) {
      res.json({ error: error.message });
    });
});

app.get("/api/songs/:id", function(req, res) {
  const id = req.params.id;
  console.log(id);
  db.any(
    "SELECT song.id, artist.name, song.title FROM song, artist WHERE artist.id = song.artist_id AND song.id = $1",
    [id]
  )
    .then(function(data) {
      res.json(data);
    })
    .catch(function(error) {
      res.json({ error: error.message });
    });
});

app.post("/api/artists", function(req, res) {
  const { artist, email } = req.body;
  db.one(
    `INSERT INTO artist(name, email)
      VALUES($1, $2) RETURNING id`,
    [artist, email]
  )
    .then(data => {
      res.json(Object.assign({}, { id: data.id }, req.body));
    })
    .catch(error => {
      res.json({
        error: error.message
      });
    });
});

app.post("/api/songs", function(req, res) {
  // using destructing assignment to
  // extract properties into variables
  const { artistId, title, year } = req.body;
  // ES6 strings for multiline
  db.one(
    `INSERT INTO song(artist_id, title, year)
    VALUES($1, $2, $3) RETURNING id`,
    [artistId, title, year]
  )
    .then(data => {
      console.log(data.id);
      return db.one(
        `SELECT artist.name, song.title, song.id FROM song, artist 
    
        WHERE artist.id = song.artist_id
        AND song.id = $1 `,
        [data.id]
      );
      // let's combine returned id with submitted data and
      // return object with id to user
    })
    .then(artistData => {
      res.json(Object.assign({}, { artistData }, req.body));
    })
    .catch(error => {
      res.json({
        error: error.message
      });
    });
});

app.post("/api/playlists", function(req, res) {
    const { name } = req.body;
    db.one(
      `INSERT INTO playlist(name)
        VALUES($1) RETURNING id`,
      [name]
    )
      .then(data => {
        res.json(Object.assign({}, { id: data.id }, req.body));
      })
      .catch(error => {
        res.json({
          error: error.message
        });
      });
  });

  app.post("/api/playlists/:playlistId/songs", function(req, res) {
    const { songId } = req.body;
    const playlistId = req.params.playlistId;
    console.log (playlistId)

    db.one(
      `INSERT INTO song_playlist(song_id, playlist_id)
        VALUES($1, $2) RETURNING id`,
      [songId, playlistId]
    )
      .then(data => {
        res.json(Object.assign({}, { id: data.id }, req.body));
      })
      .catch(error => {
        res.json({
          error: error.message
        });
      });
  });

  app.delete("/api/playlists/:id/songs/:songId", function(req, res) {
    const playlistId = req.params.id;
    const songId = req.params.songId;

    db.none(
        'DELETE from song_playlist WHERE song_id = $1 and playlist_id = $2', [playlistId, songId]
    )
    .then(res.status(204).send('deleted'))
    .catch(error => {
        res.json({
            error: error.message
        });
    });
  })


  app.delete("/api/playlists/:id", function(req, res) {
    const playlistId = req.params.id;

    db.none(
        'DELETE from song_playlist WHERE playlist_id = $1', [playlistId]
    )
    .then(db.none(
        'DELETE from playlist WHERE id = $1', [playlistId]        
    ))
    .then(res.status(204).send('deleted'))
    .catch(error => {
        res.json({
            error: error.message
        });
    });
  })

//POST /songs has already been implemented. Update it so that returns object with id, artist (name, not artist_id) and title. You will probably need to run a second query to get the artist.

app.listen(8080, function() {
  console.log("Listening on port 8080!");
});
