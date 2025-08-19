import React from "react";
import mobileImage from '../assets/mobile.png';
import { Link, useNavigate } from 'react-router-dom'

export default function LandingPage() {
const router= useNavigate();

  return (
    <div className="landing-page-container">
      <nav>
        <div className="nav-header">
          <h2>Zoom Call</h2>
        </div>
        <div className="nav-lists">
            <p onClick={()=>{
              router("/43423")
            }} >Join as guest</p>
            <p onClick={()=>{
              router("/auth")
            }}>register</p>
            <div role="button">
                <p onClick={()=>{
              router("/auth")
            }}>login</p>
            </div>
        </div>
      </nav>
      <div className="landing-main-container">
        <div>
            <h1><span style={{color:"#FF9839"}}>Connect</span> with your loved once.</h1>
            <p>Cover a distance by zoom call</p>
            <div role="button">
                <Link to={"/auth"}>Get Started</Link>
            </div>
        </div>
        <div>
            <img src={mobileImage} alt="" />
       </div>
    </div>
    </div>

    
  );
}
