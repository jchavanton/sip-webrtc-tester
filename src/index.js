/*
 * Copyright (C) 2022 Julien Chavanton <jchavanton@gmail.com>
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA~
 */

import {userAgentConnect, userAgentCall,userAgentDisconnectCall,userAgentDisconnect} from "./softphone";

var buttonConnect = document.querySelector('#connect');
var buttonCall = document.querySelector('#call');
var buttonHangup = document.querySelector('#hangup');
var buttonDisconnect = document.querySelector('#disconnect');
var buttonSetserver = document.querySelector('#set_server');
var buttonSetusername = document.querySelector('#set_username');
var buttonSetpassword = document.querySelector('#set_password');
var buttonSetxpin = document.querySelector('#set_xpin');
var buttonSetcallee = document.querySelector('#set_callee');

document.getElementById("server").value = localStorage.getItem('server');
document.getElementById("username").value = localStorage.getItem('username');
document.getElementById("password").value = localStorage.getItem('password');
document.getElementById("xpin").value = localStorage.getItem('xpin');
document.getElementById("callee").value = localStorage.getItem('callee');

buttonSetserver.addEventListener('click', ()=>{
  var v = document.getElementById("server").value
  console.log(v)
  localStorage.setItem("server",v)
})
buttonSetusername.addEventListener('click', ()=>{
  var v = document.getElementById("username").value
  console.log(v)
  localStorage.setItem("username",v)
})
buttonSetpassword.addEventListener('click', ()=>{
  var v = document.getElementById("password").value
  console.log(v)
  localStorage.setItem("password",v)
})
buttonSetxpin.addEventListener('click', ()=>{
  var v = document.getElementById("xpin").value
  console.log(v)
  localStorage.setItem("xpin",v)
})
buttonSetcallee.addEventListener('click', ()=>{
  var v = document.getElementById("callee").value
  console.log(v)
  localStorage.setItem("callee",v)
})

function connected () {
  console.log("connected ...");
}

function disconnected () {
  console.log("disconnected ...");
}

buttonConnect.addEventListener('click', ()=>{ 
  console.log('wss://'+localStorage.getItem('server'))
  const params = {
    server: localStorage.getItem('server'),
    username: localStorage.getItem('username'),
    password: localStorage.getItem('password'),
    xpin: localStorage.getItem('xpin'),
    callee: 'sip:'+localStorage.getItem('callee'),
  }
  userAgentConnect(params, connected, disconnected);
})

buttonCall.addEventListener('click', ()=>{ 
  var target = 'sip:'+localStorage.getItem('callee');
  console.log("calling:"+target)
  userAgentCall("", target, "mediaElement", connected, disconnected);
})

buttonDisconnect.addEventListener('click', ()=>{
  userAgentDisconnect(disconnected);
})

buttonHangup.addEventListener('click', ()=>{
  userAgentDisconnectCall(disconnected);
})
