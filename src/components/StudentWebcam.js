import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import hark from "hark"; // Import voice activity detector

const socket = io("http://localhost:5000");

const StudentWebcam = ({ studentId, onPermissionGranted }) => {
  const videoRef = useRef(null);
  const screenRef = useRef(null);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);

  useEffect(() => {
    playExamWarning();

    setTimeout(() => {
      const confirmExam = window.confirm(
        "⚠️ WARNING: Your webcam, screen, and microphone will be monitored. Click OK to accept or Cancel to exit."
      );

      if (confirmExam) {
        setIsPermissionGranted(true);
        onPermissionGranted(true);
        socket.emit("joinExam", studentId);
        startWebcam();
        startVoiceDetection(); // Start monitoring voice
      } else {
        alert("❌ You cannot proceed without accepting monitoring.");
        window.location.href = "https://www.google.com"; // Redirect out
      }
    }, 5000);

    return () => {
      socket.off("joinExam");
    };
  }, [studentId, onPermissionGranted]);

  const playExamWarning = () => {
    const msg = new SpeechSynthesisUtterance();
    msg.text =
      "Warning! Your webcam, screen, and microphone will be monitored during this exam. If you decline, you cannot continue.";
    window.speechSynthesis.speak(msg);
  };

  const startWebcam = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
        socket.emit("sendVideoStream", { studentId, videoData: stream });
        startVoiceDetection(stream);
      })
      .catch((err) => console.error("🚨 Webcam or Microphone access denied:", err));
  };

  // Start monitoring voice activity
  const startVoiceDetection = (stream) => {
    if (!stream) {
      console.error("❌ No audio stream available for voice detection.");
      return;
    }

    const speechEvents = hark(stream, { threshold: -50 });

    speechEvents.on("speaking", () => {
      console.log("🎙️ Student is talking!");
      socket.emit("cheatingAlert", { studentId, message: "Unauthorized talking detected!" });
    });
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenRef.current.srcObject = screenStream;
      setIsSharingScreen(true);
      socket.emit("sendScreenStream", { studentId, screenData: screenStream });

      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error("🚨 Screen sharing denied:", err);
    }
  };

  const stopScreenShare = () => {
    if (screenRef.current?.srcObject) {
      screenRef.current.srcObject.getTracks().forEach((track) => track.stop());
      screenRef.current.srcObject = null;
      setIsSharingScreen(false);
      socket.emit("stopScreenStream", { studentId });
    }
  };

  return (
    <div>
      <h3>Live Webcam & Screen Monitoring</h3>

      <video ref={videoRef} autoPlay playsInline />
      
      {isSharingScreen && (
        <div>
          <h4>Screen Sharing Active</h4>
          <video ref={screenRef} autoPlay playsInline />
        </div>
      )}

      {!isSharingScreen && isPermissionGranted && <button onClick={startScreenShare}>Start Screen Sharing</button>}
      {isSharingScreen && <button onClick={stopScreenShare}>Stop Screen Sharing</button>}
    </div>
  );
};

export default StudentWebcam;
