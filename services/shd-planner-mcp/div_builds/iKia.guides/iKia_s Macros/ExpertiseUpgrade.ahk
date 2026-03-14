;Macro and config by Dreamej

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

tooltip, Expertise Upgrade Macro - Made by Dreamej, %TooltipX%, %Tooltip2%, 2

tooltip, F2 - Start, %TooltipX%, %Tooltip4%, 4
tooltip, F3 - Reload, %TooltipX%, %Tooltip5%, 5
tooltip, F4 - Exit, %TooltipX%, %Tooltip6%, 6

;====================================================================================================;

f2::
Loop
{
	Send {space down}
	Sleep 3400
	Send {space up}
	Sleep 200
}

f3::
Reload

f4::
Send {space up}
ExitApp