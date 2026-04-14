<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>LMS Course Dashboard</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "tertiary-dim": "#534685",
                    "primary": "#4a40e0",
                    "on-primary-fixed-variant": "#1a0099",
                    "inverse-primary": "#8582ff",
                    "surface-container-lowest": "#ffffff",
                    "surface-container-high": "#dfe3e6",
                    "on-secondary-fixed-variant": "#3a45ad",
                    "on-surface": "#2c2f31",
                    "primary-fixed": "#9895ff",
                    "inverse-surface": "#0b0f10",
                    "on-secondary-fixed": "#192490",
                    "primary-dim": "#3d30d4",
                    "error-dim": "#a70138",
                    "secondary-fixed": "#cbceff",
                    "tertiary": "#5f5292",
                    "on-tertiary": "#f6f0ff",
                    "tertiary-fixed": "#c3b4fc",
                    "surface-container-highest": "#d9dde0",
                    "surface-dim": "#d0d5d8",
                    "surface-tint": "#4a40e0",
                    "on-primary-container": "#14007e",
                    "error": "#b41340",
                    "primary-container": "#9895ff",
                    "secondary-container": "#cbceff",
                    "on-background": "#2c2f31",
                    "on-surface-variant": "#595c5e",
                    "primary-fixed-dim": "#8885ff",
                    "error-container": "#f74b6d",
                    "on-secondary": "#f3f1ff",
                    "on-tertiary-container": "#3d306f",
                    "on-secondary-container": "#303aa3",
                    "on-primary": "#f4f1ff",
                    "surface-container": "#e5e9eb",
                    "on-error": "#ffefef",
                    "surface": "#f5f7f9",
                    "on-tertiary-fixed": "#281a58",
                    "surface-container-low": "#eef1f3",
                    "secondary-fixed-dim": "#babfff",
                    "surface-variant": "#d9dde0",
                    "background": "#f5f7f9",
                    "surface-bright": "#f5f7f9",
                    "secondary-dim": "#3943ac",
                    "on-error-container": "#510017",
                    "on-primary-fixed": "#000000",
                    "outline": "#747779",
                    "outline-variant": "#abadaf",
                    "secondary": "#4650b9",
                    "tertiary-container": "#c3b4fc",
                    "inverse-on-surface": "#9a9d9f",
                    "tertiary-fixed-dim": "#b6a7ee",
                    "on-tertiary-fixed-variant": "#463a78"
            },
            "borderRadius": {
                    "DEFAULT": "1rem",
                    "lg": "2rem",
                    "xl": "3rem",
                    "full": "9999px"
            },
            "fontFamily": {
                    "headline": ["Plus Jakarta Sans"],
                    "body": ["Plus Jakarta Sans"],
                    "label": ["Plus Jakarta Sans"]
            }
          },
        },
      }
    </script>
<style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .glass-card {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-surface text-on-surface min-h-screen">
<nav class="fixed top-0 w-full z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl flex justify-between items-center px-6 py-4 w-full shadow-[0px_20px_40px_rgba(74,64,224,0.08)]">
<div class="flex items-center gap-4">
<button class="material-symbols-outlined text-indigo-600 dark:text-indigo-400 p-2 hover:bg-slate-100/50 transition-colors rounded-full" data-icon="menu">menu</button>
<span class="font-['Plus_Jakarta_Sans'] font-bold tracking-tighter text-slate-900 dark:text-slate-50 text-xl">Session</span>
</div>
<div class="flex items-center gap-3">
<div class="bg-surface-container-low px-4 py-2 rounded-full flex items-center gap-2 cursor-pointer hover:bg-slate-100/50 transition-colors">
<span class="font-['Plus_Jakarta_Sans'] font-bold tracking-tight text-lg text-indigo-700 dark:text-indigo-300">2526EVESEM</span>
<span class="material-symbols-outlined text-slate-500" data-icon="expand_more">expand_more</span>
</div>
</div>
</nav>
<main class="pt-28 pb-32 px-6 md:px-12 max-w-7xl mx-auto">
<nav class="flex items-center gap-2 mb-8 px-2">
<span class="text-sm font-medium text-slate-400">Dashboard</span>
<span class="material-symbols-outlined text-xs text-slate-400" data-icon="chevron_right">chevron_right</span>
<span class="text-sm font-semibold text-primary">Courses</span>
</nav>
<section class="mb-12">
<div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
<div>
<h1 class="text-5xl font-extrabold tracking-tight text-on-surface mb-2">My Courses</h1>
<div class="flex items-center gap-2">
<span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
<p class="text-on-surface-variant font-medium tracking-wide uppercase text-sm">6 Active</p>
</div>
</div>
<div class="flex gap-3">
<button class="bg-surface-container-high text-primary px-6 py-3 rounded-lg font-bold text-sm hover:scale-95 transition-transform duration-200">Catalog</button>
<button class="bg-gradient-to-r from-primary to-primary-container text-on-primary px-6 py-3 rounded-lg font-bold text-sm hover:scale-95 transition-transform duration-200">New Enrollment</button>
</div>
</div>
</section>
<section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
<div class="glass-card rounded-lg p-8 flex flex-col h-full shadow-[0px_20px_40px_rgba(74,64,224,0.08)] group hover:scale-[1.02] transition-transform duration-300">
<div class="flex-grow">
<div class="mb-6 rounded-lg overflow-hidden h-48 bg-slate-100">
<img alt="Cyberpunk digital grid" class="w-full h-full object-cover" data-alt="Abstract blue digital grid representing computer science and logic circuits with glowing cyan lines and dark background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXH4rpj7vpisMzxUFMUn8RLJAgtchZXElujHTyp4SlQ5-xmbsZHogrPebg9lVFBBmO4LkfPxWPvtfIt_hVMucpX8ScI6TrGzXtMcOqEwqjZIQWnkn169Q-mCHG1NudSjchpdjuHOedDQrJyrj-yaKHTaFcSNUMoiBjbRVkMjuNTgOu3W8gHrQZCGrFoiTP6lSe75QQYeIC6lgL9QcW_xPv8gigVCcJGuPTZzZfeWRLl_ohvCAAaKTeKSQcam_UrnYIi0SI-fTNIsQc"/>
</div>
<span class="label-md font-['Plus_Jakarta_Sans'] text-[11px] font-bold tracking-wide uppercase text-primary mb-2 block">Computer Science &amp; Engineering</span>
<h3 class="text-xl font-bold leading-tight text-on-surface mb-6">Theory of Computation - UCS701</h3>
</div>
<div class="mt-auto">
<div class="flex justify-between items-end mb-2">
<span class="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Progress</span>
<span class="text-lg font-extrabold text-primary">75%</span>
</div>
<div class="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div class="h-full bg-primary rounded-full" style="width: 75%;"></div>
</div>
<div class="flex justify-between mt-6 pt-6 border-t border-slate-100/10">
<div class="flex -space-x-2">
<div class="w-8 h-8 rounded-full border-2 border-white overflow-hidden">
<img alt="User" class="w-full h-full object-cover" data-alt="Portrait of a professional professor with glasses in a library" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJ7JQRITAr8s8VfEAQhcE7QGOm7DlueB7C9LKlHYN1ieySyMnBLCEdHNfvFLrqPg_Az6G8apGHMvnfzDAjHzxWfkcKURRIogz2yUi41akjdxqe1ng6hzhya9gGvlR_WysR05v-UErZktDyNuCI4m_CU4H_YfcafRiOkrrTrIwuP5qcmVRiTep_-gs7pLkZ4FNfV6Whd-EETt99nhl8SU8rqSLN2yEvVnwcxHqSarW-hrQSJiQ-4xEXbIdiqAVFpSlph_IjeLZU7bni"/>
</div>
<div class="w-8 h-8 rounded-full border-2 border-white bg-primary-container flex items-center justify-center text-[10px] font-bold text-on-primary-container">+12</div>
</div>
<button class="material-symbols-outlined text-primary" data-icon="arrow_forward_ios">arrow_forward_ios</button>
</div>
</div>
</div>
<div class="glass-card rounded-lg p-8 flex flex-col h-full shadow-[0px_20px_40px_rgba(74,64,224,0.08)] group hover:scale-[1.02] transition-transform duration-300">
<div class="flex-grow">
<div class="mb-6 rounded-lg overflow-hidden h-48 bg-slate-100">
<img alt="Electronic circuit board" class="w-full h-full object-cover" data-alt="Macro photography of a sophisticated green circuit board with microprocessors and gold pins in sharp focus" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0vj71AVEqUMACfCYcM4ee6PZUIPU4ixoPYIswW5iDIrey4wiMwoT98RXRM_8u3vC4zJDAz-x0LeJtAGxVJLfYqWQzZc0JqsRNsVVEMeoNNOriEeRYN4jfQyr0z-7JOkcEruEoPJ4uTtivzEg1jCTFOgWQFl4b-XSCVYDO3-C1m1infZa779_Zhe2fg-hLlZ2ZTNHbY-ZvGSUhR0nrDo3dxFQmKb_USykETwdL8Cukr00bdxt81yrEeZRiERJ5ZP-2U1uY8VYv-5lt"/>
</div>
<span class="label-md font-['Plus_Jakarta_Sans'] text-[11px] font-bold tracking-wide uppercase text-primary mb-2 block">Electrical Engineering</span>
<h3 class="text-xl font-bold leading-tight text-on-surface mb-6">Microprocessors - UEE503</h3>
</div>
<div class="mt-auto">
<div class="flex justify-between items-end mb-2">
<span class="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Progress</span>
<span class="text-lg font-extrabold text-primary">40%</span>
</div>
<div class="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div class="h-full bg-primary rounded-full" style="width: 40%;"></div>
</div>
<div class="flex justify-between mt-6 pt-6 border-t border-slate-100/10">
<div class="flex -space-x-2">
<div class="w-8 h-8 rounded-full border-2 border-white overflow-hidden">
<img alt="User" class="w-full h-full object-cover" data-alt="Portrait of a female lecturer in a science laboratory" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZol5q5KHY55p0gXu4JWg7VLmpV6MY6TwI2zfGe8o6pAOvYS3WxTwSl-5-fcASSij1GohyBza_yyhvFbsRMhi1MsiNlKvdxAmyEfyl1ovjv1qavxCc7PNt98UeMBU_vX8uYet3A3xryR-9tefCmA7rXSRiKFPprT9VJOm0vFDvwLe-0JfE3j6kxM2SD7xXZe7DlGB6VPBAp2WwyuXVJi1ml8Z4_03aiSP1Aj1vqkU9VldkQ2Px6uymWXZuzMyk_a4jCp2pzg8Mse-X"/>
</div>
<div class="w-8 h-8 rounded-full border-2 border-white bg-primary-container flex items-center justify-center text-[10px] font-bold text-on-primary-container">+8</div>
</div>
<button class="material-symbols-outlined text-primary" data-icon="arrow_forward_ios">arrow_forward_ios</button>
</div>
</div>
</div>
<div class="glass-card rounded-lg p-8 flex flex-col h-full shadow-[0px_20px_40px_rgba(74,64,224,0.08)] group hover:scale-[1.02] transition-transform duration-300">
<div class="flex-grow">
<div class="mb-6 rounded-lg overflow-hidden h-48 bg-slate-100">
<img alt="Abstract math formulas" class="w-full h-full object-cover" data-alt="Chalkboard with complex mathematical formulas and geometric diagrams in soft ambient school light" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCO-LeD4xs-nAfKWR6AbBrD-fnsLVNtEoT7zyR6cDD1iMT7AWz8-9mxnfd1V3_u3zOViP4Zv1r4n6dasxiDW467pBnsAwtmhLRfnN_SS4dKgyVK8SQqn0z4k9XsBJDc5opjaf16iee2IodLOoKK9CNY2TgqO4R1-q2Y7KU8F_zX5Mzhgf9Sh_ZWo2ziM7V0SojUohtOqOPf7hvFLqdvuAaXr0VPQP56BAIxbxlAXyOMea7EvAFvEfchLsi5H9PnKie_hzJWCPzAkRzW"/>
</div>
<span class="label-md font-['Plus_Jakarta_Sans'] text-[11px] font-bold tracking-wide uppercase text-primary mb-2 block">Mathematics</span>
<h3 class="text-xl font-bold leading-tight text-on-surface mb-6">Discrete Structures - UMA302</h3>
</div>
<div class="mt-auto">
<div class="flex justify-between items-end mb-2">
<span class="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Progress</span>
<span class="text-lg font-extrabold text-primary">90%</span>
</div>
<div class="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div class="h-full bg-primary rounded-full" style="width: 90%;"></div>
</div>
<div class="flex justify-between mt-6 pt-6 border-t border-slate-100/10">
<div class="flex -space-x-2">
<div class="w-8 h-8 rounded-full border-2 border-white overflow-hidden">
<img alt="User" class="w-full h-full object-cover" data-alt="Portrait of a young academic woman with a bright smile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAV4HgvVuXmwf4QF_D4yKH62a5UAnhGXJPqhXldADH7G3qWCtXRxRsVT_-nZrzeBKdmVHgaaglYLAY9By2ercNKsyg19RkSSukHZhDwxc6gsmV13IsUSLgqROmhoIjXjrBNPx9x3r0eSdqcErxiOpkFlVqdOj32RQibtMzDdMZS1Cttf4DM1cmQyeVWx2w65aqsJU1I9ZvEquwLTUVZvoA5WRNfVgmkb4Z-INJU4XQXQFQydSkRS97TU9-BKuUt0-bFszAHKfqdQhKQ"/>
</div>
<div class="w-8 h-8 rounded-full border-2 border-white bg-primary-container flex items-center justify-center text-[10px] font-bold text-on-primary-container">+24</div>
</div>
<button class="material-symbols-outlined text-primary" data-icon="arrow_forward_ios">arrow_forward_ios</button>
</div>
</div>
</div>
</section>
</main>
<footer class="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl rounded-t-[32px] shadow-[0px_-10px_30px_rgba(74,64,224,0.05)]">
<div class="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-5 py-2 hover:text-indigo-500 transition-all cursor-pointer">
<span class="material-symbols-outlined mb-1" data-icon="dashboard">dashboard</span>
<span class="font-['Plus_Jakarta_Sans'] text-[11px] font-medium tracking-wide uppercase">Dashboard</span>
</div>
<div class="flex flex-col items-center justify-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-[2rem] px-5 py-2 cursor-pointer">
<span class="material-symbols-outlined mb-1" data-icon="school">school</span>
<span class="font-['Plus_Jakarta_Sans'] text-[11px] font-medium tracking-wide uppercase">Courses</span>
</div>
<div class="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-5 py-2 hover:text-indigo-500 transition-all cursor-pointer">
<span class="material-symbols-outlined mb-1" data-icon="calendar_today">calendar_today</span>
<span class="font-['Plus_Jakarta_Sans'] text-[11px] font-medium tracking-wide uppercase">Calendar</span>
</div>
<div class="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-5 py-2 hover:text-indigo-500 transition-all cursor-pointer">
<span class="material-symbols-outlined mb-1" data-icon="person">person</span>
<span class="font-['Plus_Jakarta_Sans'] text-[11px] font-medium tracking-wide uppercase">Profile</span>
</div>
</footer>
</body></html>