;Macro by iKia
;Config by Dreamej

;====================================================================================================;

CoordMode, Tooltip, Relative

;====================================================================================================;

WinActivate, Tom Clancy's The Division 2
if WinActive("Tom Clancy's The Division 2")
{
WinMaximize, Tom Clancy's The Division 2
}
else
{
msgbox, Launch Division 2
exitapp
}

;====================================================================================================;

Calculations:
WinGetActiveStats, Title, WindowWidth, WindowHeight, WindowLeft, WindowTop

ResolutionScaling := WindowWidth / (WindowWidth * 2.37)

TooltipX := WindowWidth/20
Tooltip1 := (WindowHeight/2)-(20*9)
Tooltip2 := (WindowHeight/2)-(20*8)
Tooltip3 := (WindowHeight/2)-(20*7)
Tooltip4 := (WindowHeight/2)-(20*6)
Tooltip5 := (WindowHeight/2)-(20*5)
Tooltip6 := (WindowHeight/2)-(20*4)

tooltip, Apparel Cache Macro - Made by iKia & Dreamej, %TooltipX%, %Tooltip2%, 2

tooltip, F2 - Start, %TooltipX%, %Tooltip4%, 4
tooltip, F3 - Reload, %TooltipX%, %Tooltip5%, 5
tooltip, F4 - Exit, %TooltipX%, %Tooltip6%, 6

;====================================================================================================;

f2::
Loop
{
	Send {x down}
	Sleep 2300
	Send {x up}
	Sleep 100
	Send {e down}
	Sleep 120
	Send {e up}
	Sleep 100
	Send {q down}
	Sleep 120
	Send {q up}
	Sleep 500
	Send {s down}
	Sleep 120
	Send {s up}
	Sleep 100
	Send {s down}
	Sleep 120
	Send {s up}
	Sleep 100
	Send {s down}
	Sleep 120
	Send {s up}
	Sleep 100
}


f3::
Reload

f4::
Send {x up}
Send {e up}
Send {q up}
Send {s up}
ExitApp