export const AppLoader = () => {
  return (
    <div className="flex items-center justify-center w-full h-screen bg-background">
      <style>
        {`
          .app-loader-container .circle {
            border-color: #000000 !important;
          }

          .app-loader-container .dot {
            background-color: #000000 !important;
          }

          .dark .app-loader-container .circle {
            border-color: oklch(0.64 0 0) !important;
          }

          .dark .app-loader-container .dot {
            background-color: oklch(0.64 0 0) !important;
          }

          .app-loader-container {
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .app-loader-container .circle {
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            width: 24px;
            height: 24px;
            border: solid 2.5px;
            border-radius: 50%;
            margin: 0 12px;
            background-color: transparent;
            animation: circle-keys 1.4s ease-in-out infinite;
          }

          .app-loader-container .dot {
            position: absolute;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            animation: dot-keys 1.4s ease-in-out infinite;
          }

          .app-loader-container .outline {
            position: absolute;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            animation: outline-keys 1s ease-in-out infinite;
          }

          .app-loader-container .circle:nth-child(1) {
            animation-delay: 0s;
          }

          .app-loader-container .circle:nth-child(2) {
            animation-delay: 0.3s;
          }

          .app-loader-container .circle:nth-child(3) {
            animation-delay: 0.6s;
          }

          .app-loader-container .circle:nth-child(4) {
            animation-delay: 0.9s;
          }

          .app-loader-container .circle:nth-child(1) .dot {
            animation-delay: 0s;
          }

          .app-loader-container .circle:nth-child(2) .dot {
            animation-delay: 0.3s;
          }

          .app-loader-container .circle:nth-child(3) .dot {
            animation-delay: 0.6s;
          }

          .app-loader-container .circle:nth-child(4) .dot {
            animation-delay: 0.9s;
          }

          .app-loader-container .circle:nth-child(1) .outline {
            animation-delay: 0s;
          }

          .app-loader-container .circle:nth-child(2) .outline {
            animation-delay: 0.3s;
          }

          .app-loader-container .circle:nth-child(3) .outline {
            animation-delay: 0.6s;
          }

          .app-loader-container .circle:nth-child(4) .outline {
            animation-delay: 0.9s;
          }

          @keyframes circle-keys {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.5);
              opacity: 0.5;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }

          @keyframes dot-keys {
            0% {
              transform: scale(1);
            }
            50% {
              transform: scale(0);
            }
            100% {
              transform: scale(1);
            }
          }

          @keyframes outline-keys {
            0% {
              transform: scale(0);
              outline: solid 20px;
              outline-color: inherit;
              outline-offset: 0;
              opacity: 1;
            }
            100% {
              transform: scale(1);
              outline: solid 0 transparent;
              outline-offset: 20px;
              opacity: 0;
            }
          }
        `}
      </style>
      <div className="app-loader-container">
        <div className="circle">
          <div className="dot" />
          <div className="outline" />
        </div>
        <div className="circle">
          <div className="dot" />
          <div className="outline" />
        </div>
        <div className="circle">
          <div className="dot" />
          <div className="outline" />
        </div>
        <div className="circle">
          <div className="dot" />
          <div className="outline" />
        </div>
      </div>
    </div>
  );
};
