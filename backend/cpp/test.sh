#!/usr/bin/env bash
OUT_DIR="build"
TEST_DIR="tests"

test_release() {
    echo "Testing Release"
    LOCAL_OUT_DIR="$OUT_DIR-release"
    ctest --test-dir "$LOCAL_OUT_DIR/$TEST_DIR" --output-on-failure -j4 --output-on-failure
}

test_debug() {
    echo "Testing Debug"
    ctest --test-dir "$OUT_DIR/$TEST_DIR" --output-on-failure -j4 --output-on-failure
}

MODE="$1"

if [ -z "$MODE" ]; then
    MODE="debug"
fi

case $MODE in
"debug")
    test_debug
    ;;
"release")
    test_release
    ;;
esac
