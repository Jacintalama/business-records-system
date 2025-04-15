// 'use client';

// import Image from 'next/image';
// import React from 'react';

// export default function NavBar() {
//   return (
//     <div className="bg-green-600 py-4 w-full">
//       {/* A single row (flex) with minimal padding (px-2) to keep the logo close to the edge */}
//       <div className="flex items-center justify-between px-2 text-white w-full">
//         {/* Left section: Logo + Title/Text */}
//         <div className="flex items-center space-x-2">
//           <Image
//             src="/Logo1.png"
//             alt="Left Logo"
//             width={180}
//             height={10}
//             className="object-contain"
//           />
//           <div>
//             <h2 className="text-2xl font-bold">BUSINESS RECORDS </h2>
//             <p className="text-xl">Municipality of Maasim, Sarangani</p>
//           </div>
//         </div>

//         {/* Right Logo (optional) */}
//         <Image
//           src="/Logo2.png"
//           alt="Right Logo"
//           width={90}
//           height={50}
//           className="object-contain"
//         />
//       </div>
//     </div>
//   );
// }
'use client';

import Image from 'next/image';
import React from 'react';

export default function NavBar() {
  return (
    <>
      <div className="animated-bg py-4 w-full">
        {/* A single row (flex) with minimal padding (px-2) to keep the logo close to the edge */}
        <div className="flex items-center justify-between px-2 text-white w-full">
          {/* Left section: Logo + Title/Text */}
          <div className="flex items-center space-x-2">
            <Image
              src="/Logo1.png"
              alt="Left Logo"
              width={180}
              height={10}
              className="object-contain"
            />
            <div>
              <h2 className="text-2xl font-bold">BUSINESS RECORDS</h2>
              <p className="text-xl">Municipality of Maasim, Sarangani</p>
            </div>
          </div>
          {/* Right Logo (optional) */}
          <Image
            src="/Logo2.png"
            alt="Right Logo"
            width={90}
            height={50}
            className="object-contain"
          />
        </div>
      </div>

      {/* CSS for the animated gradient background */}
      <style jsx>{`
        .animated-bg {
          background: linear-gradient(-45deg, #15803d, #16a34a, #22c55e, #84cc16);
          background-size: 400% 400%;
          animation: gradient 15s ease infinite;
        }
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </>
  );
}
