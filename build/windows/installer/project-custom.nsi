Unicode true

# Custom NSIS installer dengan WebView2 bundled
!include "x64.nsh"
!include "WinVer.nsh"
!include "FileFunc.nsh"

# Informasi Aplikasi
!define INFO_PROJECTNAME "Ritel-App"
!define INFO_COMPANYNAME "Ritel-App"
!define INFO_PRODUCTNAME "Ritel-App"
!define INFO_PRODUCTVERSION "1.0.0"
!define INFO_COPYRIGHT "Copyright 2024"
!define PRODUCT_EXECUTABLE "Ritel-App.exe"

# Architecture check
RequestExecutionLevel "admin"

# Check if WebView2 is already installed
Function CheckWebView2
    SetRegView 64
    # Check WebView2 registry key
    ReadRegStr $R0 HKLM "SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" "pv"
    ${If} $R0 != ""
        MessageBox MB_OK "WebView2 sudah terinstall: $R0"
        Goto webview2_ok
    ${EndIf}
    
    # Check user-specific key for non-admin installs
    ReadRegStr $R0 HKCU "Software\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" "pv"
    ${If} $R0 != ""
        MessageBox MB_OK "WebView2 sudah terinstall (user): $R0"
        Goto webview2_ok
    ${EndIf}
    
    # WebView2 not found, need to install
    MessageBox MB_OK "WebView2 belum terinstall, akan diinstall otomatis"
    Return
    
    webview2_ok:
        SetErrorLevel 0
        Return
FunctionEnd

# Install WebView2 function
Function InstallWebView2
    MessageBox MB_OK "Menginstall WebView2 Runtime..."
    
    # Extract WebView2 installer
    InitPluginsDir
    SetOutPath "$pluginsdir"
    File "tmp\MicrosoftEdgeWebview2Setup.exe"
    
    # Install WebView2 silently
    ExecWait '"$pluginsdir\MicrosoftEdgeWebview2Setup.exe" /silent /install'
    
    # Clean up
    Delete "$pluginsdir\MicrosoftEdgeWebview2Setup.exe"
    
    MessageBox MB_OK "WebView2 installation complete"
FunctionEnd

# Main installer section
Section "Install Ritel-App"
    # Check Windows version
    ${IfNot} ${AtLeastWin10}
        MessageBox MB_OK "Aplikasi ini membutuhkan Windows 10 atau lebih baru"
        Abort
    ${EndIf}
    
    # Create installation directory
    CreateDirectory "$INSTDIR"
    SetOutPath "$INSTDIR"
    
    # Check and install WebView2 if needed
    Call CheckWebView2
    ${If} $R0 == ""
        Call InstallWebView2
    ${EndIf}
    
    # Copy main executable
    File "..\..\bin\Ritel-App.exe"
    
    # Copy frontend assets if they exist
    ${If} ${FileExists} "..\..\..\frontend\dist\*.*"
        CreateDirectory "$INSTDIR\frontend\dist"
        SetOutPath "$INSTDIR\frontend\dist"
        File /r "..\..\..\frontend\dist\*.*"
    ${EndIf}
    
    # Copy environment files if they exist
    ${If} ${FileExists} "..\..\..\.env"
        SetOutPath "$INSTDIR"
        File "..\..\..\.env"
    ${EndIf}
    
    # Create uninstaller
    WriteUninstaller "$INSTDIR\uninstall.exe"
    
    # Registry entries for uninstaller
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Ritel-App" "DisplayName" "Ritel-App"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Ritel-App" "UninstallString" "$INSTDIR\uninstall.exe"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Ritel-App" "DisplayVersion" "1.0.0"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Ritel-App" "Publisher" "Ritel-App"
    
    MessageBox MB_OK "Ritel-App berhasil diinstall!"
SectionEnd

# Uninstaller section
Section "Uninstall"
    # Remove files
    Delete "$INSTDIR\Ritel-App.exe"
    Delete "$INSTDIR\.env"
    Delete "$INSTDIR\uninstall.exe"
    
    # Remove frontend directory
    RMDir /r "$INSTDIR\frontend"
    
    # Remove installation directory
    RMDir "$INSTDIR"
    
    # Remove registry entries
    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Ritel-App"
    
    MessageBox MB_OK "Ritel-App berhasil diuninstall"
SectionEnd