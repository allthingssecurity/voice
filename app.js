const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

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
  const inputFile = req.file.path;
  const outputFile = path.join(__dirname, 'processed_audio.wav');
  const pythonScript = 'myinfer.py'; // Replace with the actual name of your Python script

  // Execute the Python script using spawn
  const pythonProcess = spawn('python', [
    pythonScript,
    '-6',
    inputFile, // Updated to use the uploaded audio file from the server directory
    outputFile,
    '/workspace/Retrieval-based-Voice-Conversion-WebUI/weights/modi.pth', // Replace with the model path
    'cuda:0',
    'False',
    'harvest',
    'logs/oblivion_guard_v2/added_IVF2892_Flat_nprobe_1_v1.index',
    '',
    '1',
    '3',
    '0',
    '1.0',
  ]);

  pythonProcess.on('close', (code) => {
    if (code === 0) {
      // Read the processed audio file and send it to the client
      const audioData = fs.readFileSync(outputFile);
      res.writeHead(200, { 'Content-Type': 'audio/wav' });
      res.end(audioData, 'binary');
    } else {
      res.status(500).send('Error processing the audio file.');
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
