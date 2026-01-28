# Hybrid Music Demo (Capacitor + Vite)

Инструкции по установке и запуску проекта на локальной машине и для Android.

**Требования:**
- Node.js 16+ и npm или yarn
- Java JDK 11+ и Android SDK (если собираете Android APK)
- Android Studio (рекомендуется для отладки и сборки)
- Capacitor CLI (будет использоваться через npx)

**Установка:**
1. Клонируйте репозиторий и перейдите в папку проекта:

```bash
git clone <repo-url>
cd hybrid-music-demo-apk
```

2. Установите зависимости:

```bash
npm install
# или
# yarn
```

**Запуск в режиме разработки (веб):**

```bash
npm run dev
# затем откройте http://localhost:5173 или адрес, который выведет Vite
```

Если ваш `package.json` использует другой скрипт для запуска (например `start` или `serve`), используйте его.

**Сборка веб-версии:**

```bash
npm run build
# локально просмотреть сборку
npm run preview
```

**Сборка и запуск Android (Capacitor):**

1. Синхронизируйте нативный проект с веб-ресурсами:

```bash
npm run build
npx cap sync android
```

2. Откройте проект в Android Studio (рекомендуется) или запустите из CLI:

```bash
npx cap open android
# или (CLI-сборка):
cd android
./gradlew assembleDebug
# или для релиза:
./gradlew assembleRelease
```

3. Для установки собранного APK на устройство:

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Примечание: пути к APK могут отличаться в зависимости от конфигурации Gradle.

Если у вас нет Android Studio — только Capacitor / CLI

Если вы не используете Android Studio, можно собрать и установить приложение полностью через Capacitor и Gradle из командной строки:

1. Постройте веб-часть и синхронизируйте нативный проект:

```bash
npm run build
npx cap sync android
```

2. Соберите и установите Debug-версию на подключённое устройство или эмулятор (используя Gradle wrapper в Android-проекте):

```bash
cd android
./gradlew installDebug
```

Эта команда соберёт APK и попытается установить его на подключённое устройство. Если вы предпочитаете только собрать APK без установки, используйте:

```bash
./gradlew assembleDebug
# затем при необходимости установите через adb:
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

3. Альтернативно можно попробовать напрямую запустить через Capacitor (зависит от наличия Gradle/SDK в PATH):

```bash
npx cap run android
```

Примечания:
- Убедитесь, что `adb` видит ваше устройство: `adb devices`.
- Для релизной сборки используйте `./gradlew assembleRelease` и подпишите APK/Bundle согласно вашей конфигурации.
- Если встречаются ошибки сборки, установите Android SDK/компоненты или проверьте переменные окружения (`ANDROID_HOME`, `ANDROID_SDK_ROOT`).

**Полезные команды:**
- `npx cap status` — посмотреть состояние нативных платформ
- `npx cap sync` — синхронизировать все платформы
- `npx cap open android` — открыть Android-проект в Android Studio

Если нужно, могу обновить README с точными скриптами из `package.json` или добавить инструкции для iOS/CI.

**CLI: полная последовательность (без Android Studio)**

Если вы используете только Capacitor и CLI (нет Android Studio), можно выполнить команды по шагам. Ниже — разбитая и безопасная последовательность, которую вы уже использовали:

```bash
# 1) Собрать веб-часть
npm run build

# 2) Синхронизировать с Android-проектом
npx cap sync android

# 3) Установить переменные окружения (пример)
export ANDROID_HOME=$HOME/android-sdk
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64

# 4) Собрать через Gradle (в корне: android/)
cd android
./gradlew assembleDebug
# или сразу собрать и установить на подключённое устройство:
./gradlew installDebug
cd ..

# 5) Добавить adb в PATH (если нужно) и установить APK вручную
export PATH=$HOME/android-sdk/platform-tools:$PATH
adb install -r "android/app/build/outputs/apk/debug/app-debug.apk"
```

Эта последовательность полностью выполняет сборку, синхронизацию и установку APK на устройство без Android Studio.

**Однострочная команда (всё в одной строке)**

Если вы предпочитаете выполнить всю последовательность одной командой (переменные окружения задаются только для этой команды), используйте следующую однострочную команду в bash/zsh:

```bash
( export ANDROID_HOME="$HOME/android-sdk" \
	&& export JAVA_HOME="/usr/lib/jvm/java-21-openjdk-amd64" \
	&& export PATH="$HOME/android-sdk/platform-tools:$PATH" \
	&& npm run build \
	&& npx cap sync android \
	&& cd android \
	&& ./gradlew assembleDebug \
	&& cd .. \
	&& adb install -r "android/app/build/outputs/apk/debug/app-debug.apk" )
```

Эта команда выполняет: сборку веб-части, синхронизацию Capacitor, установку временных переменных окружения, сборку Gradle и установку APK на подключённое устройство.

**Команды для скачивания / копирования APK и файлов**

- Скопировать собранный APK в текущую папку (локально):

```bash
cp android/app/build/outputs/apk/debug/app-debug.apk ./app-debug.apk
```

- Скачать (pull) APK с устройства (если APK уже установлен и вы не знаете путь пакета):

```bash
# Найти путь установленного пакета (замените my.package.name)
adb shell pm list packages -f | grep my.package.name
# Выведет путь вида: package:/data/app/~~.../base.apk=your.package.name
# затем:
adb pull /data/app/..../base.apk ./pulled-app.apk
```

- Установить APK на устройство (при необходимости):

```bash
adb install -r ./app-debug.apk
```

- Установить/скопировать локальную музыку на устройство (например в /sdcard/Music):

```bash
adb push ./local-song.mp3 /sdcard/Music/local-song.mp3
```

- Посмотреть подключённые устройства:

```bash
adb devices
```

**Подсказки и замечания**
- Если Gradle или adb не находятся в PATH, указывайте полный путь к `./gradlew` и `adb` или добавьте Android SDK `platform-tools` в `PATH`.
- Путь к APK в `android/app/build/outputs/apk/...` может отличаться при изменённых flavor/buildType.
- Для релизной сборки подпишите APK/Bundle и используйте `./gradlew assembleRelease`.

Если хотите, могу вставить конкретные npm-скрипты из вашего `package.json` (например `dev`, `build`, `preview`) — разрешите, и я подставлю их в README.
# lordx-music
