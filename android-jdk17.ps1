$ErrorActionPreference = "Stop"

$jdk17 = "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot"
$androidSdk = "$env:LOCALAPPDATA\Android\Sdk"

if (-not (Test-Path -LiteralPath $jdk17)) {
  throw "JDK 17 was not found at $jdk17. Install Temurin 17 or update this script with the correct path."
}

if (-not (Test-Path -LiteralPath $androidSdk)) {
  throw "Android SDK was not found at $androidSdk. Install it with Android Studio or update this script with the correct path."
}

$env:JAVA_HOME = $jdk17
$env:ANDROID_HOME = $androidSdk
$env:ANDROID_SDK_ROOT = $androidSdk
$env:Path = "$env:JAVA_HOME\bin;$env:Path"

Write-Host "Using Java from: $env:JAVA_HOME"
Write-Host "Using Android SDK from: $env:ANDROID_HOME"
java -version

npx expo run:android
