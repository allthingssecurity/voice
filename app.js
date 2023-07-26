const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

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

app.use(express.static('public')); // Serve static files from 'public' directory

app.post('/upload', upload.single('audioFile'), (req, res) => {
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

console.log('After launching python ');
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});
