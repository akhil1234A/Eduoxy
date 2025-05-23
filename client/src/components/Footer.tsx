import Link from "next/link";
import React from "react";

const Footer = ()=>{
  return (
    <div className="footer">
      <p>&copy; 2025 EDUXOY. All Rights Reserved</p>
      <div className="footer__links">
        {["About","Privacy Policy","Licencsing","Contact"].map((item)=>(
          <Link
          key={item}
          href={`#`}
          className="footer__link"
          scroll={false}
        >
          {item}
        </Link>
        ))}
      </div>
    </div>
  )
}

export default Footer; 