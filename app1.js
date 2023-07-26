const express = require('express');
const multer = require('multer');

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const session = require('express-session');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const port = 8888;

// Configure multer to handle file uploads
const storage = multer.diskStorage({
  destination: './uploads/', // Temporary directory to store uploaded files
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

// Replace 'YOUR_CLIENT_ID' and 'YOUR_CLIENT_SECRET' with your actual Google OAuth credentials
const GOOGLE_CLIENT_ID = '144930881143-3ph2s54gdknqvnl99883o2upj0iuadd4.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';

// Configure passport to use Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback', // The URL to redirect after successful authentication
	  
    },
    (accessToken, refreshToken, profile, done) => {
      // Here you can handle the authenticated user's profile, e.g., store it in the session or database.
      // For simplicity, we won't store it here. You can customize this as per your requirement.
      return done(null, profile);
    }
  )
);

// Serialize and deserialize user for session management
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Set up express-session middleware
app.use(
  session({
    secret: 'your_session_secret', // Replace this with your own secret key
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize passport and session
app.use(passport.initialize());
app.use(passport.session());

// Custom middleware to check if the user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/login');
  }
}

// Custom middleware to check audio duration
// Custom middleware to check audio duration
function checkAudioDuration(req, res, next) {
  console.log("enereted check duration")
  if (!req.file || !req.file.path) {
    // File upload was not successful or the 'audioFile' field is missing
	console.log("error")
    res.status(400).send('Please upload an audio file.');
    return;
  }
 console.log("now check for length")
  const inputFile = req.file.path;
  ffmpeg.ffprobe(inputFile, (err, metadata) => {
    if (err) {
      console.error('Error while probing audio file:', err);
      res.status(500).send('Error processing the audio file.');
      return;
    }
console.log("determined length")
    const audioDuration = metadata.format.duration;
    const maxDuration = 120; // 2 minutes in seconds
    if (audioDuration > maxDuration) {
      // Audio duration exceeds the maximum allowed duration
      res.status(400).send('Audio duration exceeds the maximum allowed (2 minutes).');
      return;
    }
console.log("passed")
    // Audio duration is within the allowed limit, continue processing
    next();
  });
}

// Custom middleware to check user-audio count
function checkUserAudioCount(req, res, next) {
  const usersData = require('./users.json');
  const userEmail = req.user.emails[0].value;
  const userAudioCount = usersData.users[userEmail] || 0;
  const maxAudioCount = 2;

  if (userAudioCount >= maxAudioCount) {
    res.status(400).send('You have reached the maximum audio submission limit.');
    return;
  }

  // Increment the user's audio count and update the JSON file
  usersData.users[userEmail] = userAudioCount + 1;
  fs.writeFileSync('./users.json', JSON.stringify(usersData, null, 2));

  // User-audio count is within the allowed limit, continue processing
  next();
}

// Add a route to handle user login (redirect to Google OAuth)
app.get('/login', passport.authenticate('google', { scope: ['profile'] }));

// Add a route to handle the Google OAuth callback
app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res, next) => {
    // Store the email in the request object for later access
    //req.email = req.user.emails[0].value;
	console.log('User Object:', req.user);
    next();
  },
  (req, res) => {
    // Redirect to the index.html after successful authentication
    res.redirect('/index.html');
  }
);

// Add a route to handle the index.html page (protected by Google OAuth)
app.get('/index.html', ensureAuthenticated, (req, res) => {
  // Serve the index.html file here
  // You can use the 'express.static' middleware to serve the file or any other method you prefer.
  // For example:
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to handle file upload and processing with audio duration and user-audio count checks
app.post('/upload', ensureAuthenticated, upload.single('audioFile'), checkUserAudioCount,  (req, res) => {
  console.log('File upload received');
  const inputFile = req.file.path;
  const outputFile = path.join(__dirname, 'processed_audio.wav');
  const pythonScript = 'myinfer.py'; // Replace with the actual name of your Python script

  // Execute the Python script using spawn
  console.log('Before launching python ');
  const pythonProcess = spawn('python3', [
    pythonScript,
    '0',
    inputFile, // Updated to use the uploaded audio file from the server directory
    outputFile,
    '/workspace/Retrieval-based-Voice-Conversion-WebUI/weights/modi.pth', // Replace with the model path
    '',
    'cuda:0',
    'pm',
  ]);
  console.log('After preparing python script ');

  pythonProcess.on('close', (code) => {
    if (code === 0) {
      console.log('Success');
      // Read the processed audio file and send it to the client
      const audioData = fs.readFileSync(outputFile);
      res.writeHead(200, { 'Content-Type': 'audio/wav' });
      res.end(audioData, 'binary');
    } else {
      console.log('Error');
      res.status(500).send('Error processing the audio file.');
    }
  });
});

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});
