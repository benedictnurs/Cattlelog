import React, { useState } from "react";
import QRCode from "qrcode";

export default function QRCodeGenerator() {
  const [domain, setDomain] = useState("daviscattlelog.com");
  const [utmSource, setUtmSource] = useState("example-source");
  const [qrCode, setQrCode] = useState("");

  const qrValue = `${domain}?utm_source=${utmSource}`;

  const generateQRCode = async (value: string) => {
    try {
      const dataUrl = await QRCode.toDataURL(value);
      setQrCode(dataUrl);
    } catch (err) {
      console.error("Failed to generate QR code", err);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.download = "qr-code.png";
    link.href = qrCode;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl p-8 space-y-8 bg-white/5 backdrop-blur-lg shadow-2xl rounded-3xl border border-white/20">
        <h1 className="text-4xl font-extrabold text-white text-center mb-6">
          🔗 Cattlelog QR Generator
        </h1>

        <p className="text-center text-white/70">
          Generate a QR code for Cattlelog to track your marketing efforts. Add
          a UTM source to track your marketing campaign. Try something like
          "may-newsletter" or "insta-post-week-2"
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Base URL
            </label>
            <input
              type="text"
              className="mt-1 block w-full rounded-lg bg-gray-100/90 border-none px-4 py-2 text-gray-800 shadow-md focus:ring-2 focus:ring-blue-600"
              value={domain}
              onChange={(e) => {
                const newValue = e.target.value;
                setDomain(newValue);
                generateQRCode(`${newValue}?utm_source=${utmSource}`);
              }}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <label className="text-sm font-medium text-white/80 sm:w-auto mb-1">
              UTM Source
            </label>
            <div className="flex-1 flex items-center">
              <span className="text-white/60 mr-1 whitespace-nowrap">
                ?utm_source=
              </span>
              <input
                type="text"
                className="block w-full rounded-lg bg-gray-100/90 border-none px-4 py-2 text-gray-800 shadow-md focus:ring-2 focus:ring-blue-600"
                value={utmSource}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setUtmSource(newValue);
                  generateQRCode(`${domain}?utm_source=${newValue}`);
                }}
              />
            </div>
          </div>

          {qrCode && (
            <div className="flex flex-col items-center pt-6">
              <img
                src={qrCode}
                alt="QR Code"
                className="bg-white p-4 rounded-xl shadow-lg"
                style={{ height: "auto", maxWidth: "100%", width: "200px" }}
              />
              <p className="text-sm text-white/70 mt-3">{qrValue}</p>
              <button
                onClick={handleDownload}
                className="mt-3 text-white/70 hover:text-white focus:outline-none"
                aria-label="Download QR code"
              >
                Download QR Code
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
