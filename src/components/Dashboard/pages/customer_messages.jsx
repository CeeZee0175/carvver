import React from "react";
import { CustomerDashboardFrame } from "../shared/customerProfileShared";
import "./profile.css";
import "../shared/messages_workspace.css";
import MessagesWorkspace from "../shared/messages_workspace";

export default function CustomerMessages() {
  return (
    <CustomerDashboardFrame mainClassName="profilePage profilePage--details messagesPage">
      <MessagesWorkspace role="customer" />
    </CustomerDashboardFrame>
  );
}
