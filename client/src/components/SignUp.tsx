"use client"
import { SignUp, useUser } from '@clerk/nextjs'
import React from 'react'
import {dark} from '@clerk/themes'

const SignUpComponent = () => {



  return (
    <SignUp appearance={{
      baseTheme: dark,
      elements: {
        rootBox: "flex justify-center items-center py-5",
        cardBox: "shadow-none",
        card: "bg-customgreys-secondarybg w-full shadow-none",
        footer: {
          background: "#25262F",
          padding: "0rem 2.5rem",
          "& > div > div:nth-child(1)": {
            background: "#25262F",
          },
        },
        formFieldLabel: "text-white-50 font-normal",
        formButtonPrimary:
          "bg-primary-700 text-white-100 hover:bg-primary-600 !shadow-none",
        formFieldInput: "bg-customgreys-primarybg text-white-50 !shadow-none",
        footerActionLink: "text-primary-750 hover:text-primary-600",
      },
    }}
    signInUrl="/signin"
    forceRedirectUrl="/select-role"
    routing="hash"
    afterSignOutUrl="/"
    />
  )
}

export default SignUpComponent