// Inlined Lucide-style SVG icons (kept inline to avoid the lucide-react dependency).
import React from 'react';

export const Icon = ({ size = 24, children, ...props }) =>
  React.createElement('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', ...props }, ...(Array.isArray(children) ? children : [children]));
export const _p = (d) => React.createElement('path', { d });
export const _ci = (cx, cy, r) => React.createElement('circle', { cx, cy, r });
export const _rect = (x, y, w, h, rx) => React.createElement('rect', { x, y, width: w, height: h, rx });
export const _line = (x1, y1, x2, y2) => React.createElement('line', { x1, y1, x2, y2 });
export const _poly = (points) => React.createElement('polyline', { points });
export const Plus = ({size=24,...r}) => React.createElement(Icon,{size,...r},_p('M12 5v14'),_p('M5 12h14'));
export const Trash2 = ({size=24,...r}) => React.createElement(Icon,{size,...r},_p('M3 6h18'),_p('M19 6l-1 14H6L5 6'),_p('M8 6V4h8v2'),_p('M10 11v6'),_p('M14 11v6'));
export const Check = ({size=24,...r}) => React.createElement(Icon,{size,...r},_poly('20 6 9 17 4 12'));
export const ChevronDown = ({size=24,...r}) => React.createElement(Icon,{size,...r},_poly('6 9 12 15 18 9'));
export const ChevronUp = ({size=24,...r}) => React.createElement(Icon,{size,...r},_poly('18 15 12 9 6 15'));
export const X = ({size=24,...r}) => React.createElement(Icon,{size,...r},_p('M18 6 6 18'),_p('M6 6l12 12'));
export const Pencil = ({size=24,...r}) => React.createElement(Icon,{size,...r},_p('M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z'));
export const Copy = ({size=24,...r}) => React.createElement(Icon,{size,...r},_rect(8,8,13,13,2),_p('M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2'));
export const RotateCcw = ({size=24,...r}) => React.createElement(Icon,{size,...r},_p('M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8'),_p('M3 3v5h5'));
export const ClipboardPaste = ({size=24,...r}) => React.createElement(Icon,{size,...r},_p('M9 3h6v3H9z'),_p('M8 3H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2'),_p('M8 13h8'),_p('M8 17h8'),_p('M8 9h8'));
export const ArrowUpDown = ({size=24,...r}) => React.createElement(Icon,{size,...r},_p('M7 16V4m0 0L3 8m4-4 4 4'),_p('M17 8v12m0 0 4-4m-4 4-4-4'));
export const Archive = ({size=24,...r}) => React.createElement(Icon,{size,...r},_rect(2,3,20,5,0),_p('M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8'),_p('M10 12h4'));
export const ImageIcon = ({size=24,...r}) => React.createElement(Icon,{size,...r},_rect(3,3,18,18,2),_ci(8.5,8.5,1.5),_poly('21 15 16 10 5 21'));
export const AlertTriangle = ({size=24,...r}) => React.createElement(Icon,{size,...r},_p('M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'),_line(12,9,12,13),_line(12,17,12.01,17));
export const FileText = ({size=24,...r}) => React.createElement(Icon,{size,...r},_p('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'),_poly('14 2 14 8 20 8'),_p('M16 13H8'),_p('M16 17H8'),_p('M10 9H8'));
export const Scale = ({size=24,...r}) => React.createElement(Icon,{size,...r},_p('M16 16h6'),_p('M2 16h6'),_line(12,2,12,22),_p('M8 16 2 8l6-8'),_p('M16 16l6-8-6-8'));
export const Camera = ({size=24,...r}) => React.createElement(Icon,{size,...r},_p('M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z'),_ci(12,13,4));
export const Download = ({size=24,...r}) => React.createElement(Icon,{size,...r},_p('M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'),_poly('7 10 12 15 17 10'),_line(12,15,12,3));
export const Upload = ({size=24,...r}) => React.createElement(Icon,{size,...r},_p('M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'),_poly('17 8 12 3 7 8'),_line(12,3,12,15));
export const Flame = ({size=24,...r}) => React.createElement(Icon,{size,...r},_p('M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z'));
export const Bell = ({size=24,...r}) => React.createElement(Icon,{size,...r},_p('M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9'),_p('M13.73 21a2 2 0 0 1-3.46 0'));
