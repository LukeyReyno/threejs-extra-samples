(()=>{"use strict";var e,t={608:function(e,t,n){var o,r=this&&this.__createBinding||(Object.create?function(e,t,n,o){void 0===o&&(o=n);var r=Object.getOwnPropertyDescriptor(t,n);r&&!("get"in r?!t.__esModule:r.writable||r.configurable)||(r={enumerable:!0,get:function(){return t[n]}}),Object.defineProperty(e,o,r)}:function(e,t,n,o){void 0===o&&(o=n),e[o]=t[n]}),i=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),a=this&&this.__importStar||(o=function(e){return o=Object.getOwnPropertyNames||function(e){var t=[];for(var n in e)Object.prototype.hasOwnProperty.call(e,n)&&(t[t.length]=n);return t},o(e)},function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var n=o(e),a=0;a<n.length;a++)"default"!==n[a]&&r(t,e,n[a]);return i(t,e),t});Object.defineProperty(t,"__esModule",{value:!0});const s=a(n(437)),l=n(715),c=n(404),d=n(351),u=new s.Clock;let p,h,y,f,v,m,x,w,g;const b=()=>{h.aspect=window.innerWidth/window.innerHeight,h.updateProjectionMatrix(),v.setSize(window.innerWidth,window.innerHeight)},M=()=>{const e=60*u.getDelta();if(!0===x.userData.isSelecting){const t=m.children[0];m.remove(t),t.position.copy(x.position),t.userData.velocity.x=.02*(Math.random()-.5)*e,t.userData.velocity.y=.02*(Math.random()-.5)*e,t.userData.velocity.z=(.01*Math.random()-.05)*e,t.userData.velocity.applyQuaternion(x.quaternion),m.add(t)}f.setFromXRController(x);const t=f.intersectObjects(m.children,!1);t.length>0?g!=t[0].object&&(g&&g.material.emissive.setHex(g.currentHex),g=t[0].object,g.currentHex=g.material.emissive.getHex(),g.material.emissive.setHex(16711680)):(g&&g.material.emissive.setHex(g.currentHex),g=void 0);for(let t=0;t<m.children.length;t++){const n=m.children[t];n.userData.velocity.multiplyScalar(1-.001*e),n.position.add(n.userData.velocity),(n.position.x<-3||n.position.x>3)&&(n.position.x=s.MathUtils.clamp(n.position.x,-3,3),n.userData.velocity.x=-n.userData.velocity.x),(n.position.y<0||n.position.y>6)&&(n.position.y=s.MathUtils.clamp(n.position.y,0,6),n.userData.velocity.y=-n.userData.velocity.y),(n.position.z<-3||n.position.z>3)&&(n.position.z=s.MathUtils.clamp(n.position.z,-3,3),n.userData.velocity.z=-n.userData.velocity.z),n.rotation.x+=2*n.userData.velocity.x*e,n.rotation.y+=2*n.userData.velocity.y*e,n.rotation.z+=2*n.userData.velocity.z*e}v.render(y,h)};(()=>{p=document.createElement("div"),document.body.appendChild(p),y=new s.Scene,y.background=new s.Color(5263440),h=new s.PerspectiveCamera(50,window.innerWidth/window.innerHeight,.1,10),h.position.set(0,1.6,3),y.add(h),m=new s.LineSegments(new l.BoxLineGeometry(6,6,6,10,10,10).translate(0,3,0),new s.LineBasicMaterial({color:12369084})),y.add(m),y.add(new s.HemisphereLight(10855845,9013641,3));const e=new s.DirectionalLight(16777215,3);e.position.set(1,1,1).normalize(),y.add(e);const t=new s.BoxGeometry(.15,.15,.15);for(let e=0;e<200;e++){const e=new s.Mesh(t,new s.MeshLambertMaterial({color:16777215*Math.random()}));e.position.x=4*Math.random()-2,e.position.y=4*Math.random(),e.position.z=4*Math.random()-2,e.rotation.x=2*Math.random()*Math.PI,e.rotation.y=2*Math.random()*Math.PI,e.rotation.z=2*Math.random()*Math.PI,e.scale.x=Math.random()+.5,e.scale.y=Math.random()+.5,e.scale.z=Math.random()+.5,e.userData.velocity=new s.Vector3,e.userData.velocity.x=.01*Math.random()-.005,e.userData.velocity.y=.01*Math.random()-.005,e.userData.velocity.z=.01*Math.random()-.005,m.add(e)}f=new s.Raycaster,v=new s.WebGLRenderer({antialias:!0}),v.setPixelRatio(window.devicePixelRatio),v.setSize(window.innerWidth,window.innerHeight),v.setAnimationLoop(M),v.xr.enabled=!0,p.appendChild(v.domElement),x=v.xr.getController(0);x.addEventListener("selectstart",(()=>{x.userData.isSelecting=!0})),x.addEventListener("selectend",(()=>{x.userData.isSelecting=!1})),x.addEventListener("connected",(e=>{const t=(e=>{let t,n;switch(e.targetRayMode){case"tracked-pointer":return t=new s.BufferGeometry,t.setAttribute("position",new s.Float32BufferAttribute([0,0,0,0,0,-1],3)),t.setAttribute("color",new s.Float32BufferAttribute([.5,.5,.5,0,0,0],3)),n=new s.LineBasicMaterial({vertexColors:!0,blending:s.AdditiveBlending}),new s.Line(t,n);case"gaze":return t=new s.RingGeometry(.02,.04,32).translate(0,0,-1),n=new s.MeshBasicMaterial({opacity:.5,transparent:!0}),new s.Mesh(t,n)}})(e.data);t&&x.add(t)})),x.addEventListener("disconnected",(()=>{x.remove(x.children[0])})),y.add(x);const n=new d.XRControllerModelFactory;w=v.xr.getControllerGrip(0),w.add(n.createControllerModel(w)),y.add(w),window.addEventListener("resize",b),document.body.appendChild(c.XRButton.createButton(v,{optionalFeatures:["depth-sensing"],depthSensing:{usagePreference:["gpu-optimized"],dataFormatPreference:[]}}))})()},715:(e,t,n)=>{n.r(t),n.d(t,{BoxLineGeometry:()=>r});var o=n(922);class r extends o.LoY{constructor(e=1,t=1,n=1,r=1,i=1,a=1){super();const s=e/2,l=t/2,c=n/2,d=e/(r=Math.floor(r)),u=t/(i=Math.floor(i)),p=n/(a=Math.floor(a)),h=[];let y=-s,f=-l,v=-c;for(let e=0;e<=r;e++)h.push(y,-l,-c,y,l,-c),h.push(y,l,-c,y,l,c),h.push(y,l,c,y,-l,c),h.push(y,-l,c,y,-l,-c),y+=d;for(let e=0;e<=i;e++)h.push(-s,f,-c,s,f,-c),h.push(s,f,-c,s,f,c),h.push(s,f,c,-s,f,c),h.push(-s,f,c,-s,f,-c),f+=u;for(let e=0;e<=a;e++)h.push(-s,-l,v,-s,l,v),h.push(-s,l,v,s,l,v),h.push(s,l,v,s,-l,v),h.push(s,-l,v,-s,-l,v),v+=p;this.setAttribute("position",new o.qtW(h,3))}}},404:(e,t,n)=>{n.r(t),n.d(t,{XRButton:()=>o});class o{static createButton(e,t={}){const n=document.createElement("button");function o(o){let r=null;async function i(t){t.addEventListener("end",a),await e.xr.setSession(t),n.textContent="STOP XR",r=t}function a(){r.removeEventListener("end",a),n.textContent="START XR",r=null}n.style.display="",n.style.cursor="pointer",n.style.left="calc(50% - 50px)",n.style.width="100px",n.textContent="START XR";const s={...t,optionalFeatures:["local-floor","bounded-floor","layers",...t.optionalFeatures||[]]};n.onmouseenter=function(){n.style.opacity="1.0"},n.onmouseleave=function(){n.style.opacity="0.5"},n.onclick=function(){null===r?navigator.xr.requestSession(o,s).then(i):(r.end(),void 0!==navigator.xr.offerSession&&navigator.xr.offerSession(o,s).then(i).catch((e=>{console.warn(e)})))},void 0!==navigator.xr.offerSession&&navigator.xr.offerSession(o,s).then(i).catch((e=>{console.warn(e)}))}function r(){n.style.display="",n.style.cursor="auto",n.style.left="calc(50% - 75px)",n.style.width="150px",n.onmouseenter=null,n.onmouseleave=null,n.onclick=null}function i(e){r(),console.warn("Exception when trying to call xr.isSessionSupported",e),n.textContent="XR NOT ALLOWED"}function a(e){e.style.position="absolute",e.style.bottom="20px",e.style.padding="12px 6px",e.style.border="1px solid #fff",e.style.borderRadius="4px",e.style.background="rgba(0,0,0,0.1)",e.style.color="#fff",e.style.font="normal 13px sans-serif",e.style.textAlign="center",e.style.opacity="0.5",e.style.outline="none",e.style.zIndex="999"}if("xr"in navigator)return n.id="XRButton",n.style.display="none",a(n),navigator.xr.isSessionSupported("immersive-ar").then((function(e){e?o("immersive-ar"):navigator.xr.isSessionSupported("immersive-vr").then((function(e){e?o("immersive-vr"):(r(),n.textContent="XR NOT SUPPORTED")})).catch(i)})).catch(i),n;{const e=document.createElement("a");return!1===window.isSecureContext?(e.href=document.location.href.replace(/^http:/,"https:"),e.innerHTML="WEBXR NEEDS HTTPS"):(e.href="https://immersiveweb.dev/",e.innerHTML="WEBXR NOT AVAILABLE"),e.style.left="calc(50% - 90px)",e.style.width="180px",e.style.textDecoration="none",a(e),e}}}}},n={};function o(e){var r=n[e];if(void 0!==r)return r.exports;var i=n[e]={exports:{}};return t[e].call(i.exports,i,i.exports,o),i.exports}o.m=t,e=[],o.O=(t,n,r,i)=>{if(!n){var a=1/0;for(d=0;d<e.length;d++){for(var[n,r,i]=e[d],s=!0,l=0;l<n.length;l++)(!1&i||a>=i)&&Object.keys(o.O).every((e=>o.O[e](n[l])))?n.splice(l--,1):(s=!1,i<a&&(a=i));if(s){e.splice(d--,1);var c=r();void 0!==c&&(t=c)}}return t}i=i||0;for(var d=e.length;d>0&&e[d-1][2]>i;d--)e[d]=e[d-1];e[d]=[n,r,i]},o.d=(e,t)=>{for(var n in t)o.o(t,n)&&!o.o(e,n)&&Object.defineProperty(e,n,{enumerable:!0,get:t[n]})},o.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),o.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},(()=>{var e={385:0};o.O.j=t=>0===e[t];var t=(t,n)=>{var r,i,[a,s,l]=n,c=0;if(a.some((t=>0!==e[t]))){for(r in s)o.o(s,r)&&(o.m[r]=s[r]);if(l)var d=l(o)}for(t&&t(n);c<a.length;c++)i=a[c],o.o(e,i)&&e[i]&&e[i][0](),e[i]=0;return o.O(d)},n=self.webpackChunkthreejs_extra_samples=self.webpackChunkthreejs_extra_samples||[];n.forEach(t.bind(null,0)),n.push=t.bind(null,n.push.bind(n))})();var r=o.O(void 0,[867],(()=>o(608)));r=o.O(r)})();