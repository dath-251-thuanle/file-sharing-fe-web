"use client";

import { Component } from "react";
import Link from "next/link";
import { ShieldCheck, Clock, Lock, UploadCloud } from "lucide-react";

export default class Home extends Component {
  render() {
    return (
      <div className="flex flex-col items-center">
        <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10">
            Mock dashboard.
        </p>
      </div>
    );
  }
}