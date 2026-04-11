import React from "react";
import { FreelancerDashboardFrame } from "../shared/customerProfileShared";
import "./profile.css";
import "../shared/messages_workspace.css";
import MessagesWorkspace from "../shared/messages_workspace";

export default function FreelancerMessages() {
  return (
    <FreelancerDashboardFrame mainClassName="profilePage profilePage--details messagesPage">
      <MessagesWorkspace role="freelancer" />
    </FreelancerDashboardFrame>
  );
}
