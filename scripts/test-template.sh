#!/usr/bin/env bash
#
# Creates a throwaway app from this template exactly like a user would
# (npm pack + `react-native init --template`) and validates it.
#
# Usage:
#   bash scripts/test-template.sh [work-dir]
#
# Env:
#   APP_NAME        name of the generated app            (default: SmokeApp)
#   RN_CLI_VERSION  @react-native-community/cli version  (default: 20.2.0)
#   ANDROID_BUILD   "1" to also run ./gradlew assembleDebug
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK_DIR="${1:-$(mktemp -d)}"
APP_NAME="${APP_NAME:-SmokeApp}"
RN_CLI_VERSION="${RN_CLI_VERSION:-20.2.0}"

mkdir -p "$WORK_DIR"
WORK_DIR="$(cd "$WORK_DIR" && pwd)"
rm -rf "${WORK_DIR:?}/$APP_NAME" "$WORK_DIR"/rn-app-launcher-*.tgz

echo "› Packing template from $ROOT"
(cd "$ROOT" && npm pack --pack-destination "$WORK_DIR" --silent >/dev/null)
TARBALL="$(ls "$WORK_DIR"/rn-app-launcher-*.tgz)"

echo "› Creating $APP_NAME in $WORK_DIR"
cd "$WORK_DIR"
CI=1 npx --yes "@react-native-community/cli@$RN_CLI_VERSION" init "$APP_NAME" \
  --template "file:$TARBALL" \
  --skip-git-init \
  --install-pods false \
  --pm npm

cd "$APP_NAME"

if grep -rIl --exclude-dir=node_modules -e HelloWorld -e helloworld . >/dev/null; then
  echo "✗ Placeholder 'HelloWorld' was not replaced in:"
  grep -rIl --exclude-dir=node_modules -e HelloWorld -e helloworld .
  exit 1
fi

echo "› typecheck + lint + tests"
npm run validate

echo "› prettier"
npm run format:check

echo "› release JS bundles"
npx react-native bundle --platform android --dev false --entry-file index.js \
  --bundle-output "$WORK_DIR/android.bundle.js"
npx react-native bundle --platform ios --dev false --entry-file index.js \
  --bundle-output "$WORK_DIR/ios.bundle.js"

if [[ "${ANDROID_BUILD:-0}" == "1" ]]; then
  echo "› Android debug build"
  (cd android && ./gradlew assembleDebug -PreactNativeArchitectures=x86_64 --no-daemon)
fi

echo "✓ Template OK: $WORK_DIR/$APP_NAME"
