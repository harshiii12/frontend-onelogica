import  { useState, useEffect, useRef } from "react";
import { Device } from "@twilio/voice-sdk";
function App() {
    const [device, setDevice] = useState(null);
    const [token, setToken] = useState(null);
    const [logEntries, setLogEntries] = useState([]);
    const [call, setCall] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [clientName, setClientName] = useState(null);

    const logRef = useRef(null);
    const phoneNumberInputRef = useRef(null);

    useEffect(() => {
        fetch("http://localhost:3000/token")
            .then((response) => response.json())
            .then((data) => {
                setToken(data.token);
                setClientName(data.identity);
            })
            .catch((error) => {
                console.error("Error fetching token:", error);
            });

        return () => {
            if (device) {
                device.unregister();
                device.disconnectAll();
            }
        };
    }, []);

    useEffect(() => {
        if (token) {
            const newDevice = new Device(token, {
                logLevel: 1,
                codecPreferences: ["opus", "pcmu"],
            });
            setDevice(newDevice);

            newDevice.on("registered", () => {
                log("Twilio.Device Ready to make and receive calls!");
            });

            newDevice.on("error", (error) => {
                logError(`Twilio.Device Error: ${error.message}`);
            });

            newDevice.register();

            getAudioDevices();
        }
    }, [token]);

    const makeOutgoingCall = async () => {
        const phoneNumber = phoneNumberInputRef.current.value;
        if (device && phoneNumber) {
            log(`Attempting to call ${phoneNumber} ...`);

            // Connect to the Twilio.Device
            const newCall = await device.connect({
                params: {
                    To: phoneNumber,
                },
            });

            console.log("callhere",newCall)

            newCall.on("accept", () => {
                log("Call in progress ...");
                setCall(newCall);
            });

            newCall.on("disconnect", () => {
                log("Call disconnected.");
                setCall(null);
            });

            newCall.on("cancel", () => {
                log("Call disconnected.");
                setCall(null);
            });

        } else {
            log("Please enter a phone number to call.");
        }
    };

    // Get audio devices
    const getAudioDevices = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (error) {
            console.error("Error getting audio devices:", error);
            logError(
                "An error occurred while getting audio devices. See your browser console for more information."
            );
        }
    };

    const log = (message) => {
        setLogEntries([...logEntries, message]);
    };

    const logError = (message) => {
        setLogEntries([...logEntries, `Error: ${message}`]);
    };

    const hangupCall = () => {
        if (call) {
            call.disconnect();
        }
    };

    return (
        <div className="container">
            <h1>Onelogica Call Me</h1>
            {clientName && (
                <div id="client-name">
                    Your client name: <strong>{clientName}</strong>
                </div>
            )}
            <div id="log" ref={logRef}>
                {logEntries.map((entry, index) => (
                    <p key={index} className="log-entry">
                        {entry}
                    </p>
                ))}
            </div>
            <div id="call-controls" className={!device ? "hide" : ""}>
                <input
                    id="phone-number"
                    type="tel"
                    placeholder="Enter phone number"
                    ref={phoneNumberInputRef}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <button id="button-call" onClick={makeOutgoingCall}>
                    Call
                </button>
                {call && (
                    <button id="button-hangup-outgoing" onClick={hangupCall}>
                        Hang Up
                    </button>
                )}
            </div>
           
        </div>
    );
}

export default App;
