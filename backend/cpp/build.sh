#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="build"

# Exit if not in a cmake project directory
if [ ! -f "CMakeLists.txt" ]; then
    echo "This script must be run in a directory containing a CMake project (CMakeLists.txt)."
    exit 1
fi

# Usage function prints help message
usage() {
    echo "Usage: $0 [debug|release|profile|all] [show_log=yes|no] [additional CMake args...]"
    exit 1
}

# Run string as a command
run() {
    eval "$*" || {
        return 1
    }
}

# Run Doxygen and log output; exit if it fails.
build_doxygen() {
    local out_dir="$1"
    echo "Running Doxygen..."
    if ! doxygen Doxyfile &>"$out_dir/doxygen.log"; then
        echo "Doxygen failed. Check $out_dir/doxygen.log for details."
        exit 1
    fi
}

# Configure and build with CMake and Ninja.
# Arguments: build directory, build type, compiler, additional CMake args...
build_with_cmake() {
    local build_dir="$1"
    local build_type="$2"
    local compiler="$3"
    local show_log="$4"
    shift 4
    local extra_args=("$@")

    echo "Configuring and building ${build_type} build in ${build_dir} using ${compiler}..."
    mkdir -p "$build_dir"

    if ! CXX="$compiler" cmake -G Ninja -S . -B "$build_dir" -DCMAKE_BUILD_TYPE="$build_type" "${extra_args[@]}"; then
        echo "CMake configuration failed for ${build_dir}."
        exit 1
    fi

    if [ "$show_log" == "yes" ]; then
        echo "Showing build log for ${build_dir}..."
        cmd="ninja -C $build_dir 2>&1 | tee ${build_dir}/build.log"
    else
        echo "Building ${build_type} in ${build_dir}..."
        cmd="ninja -C $build_dir &> ${build_dir}/build.log"
    fi

    local header="$(basename "$PWD")"
    local icons="dialog-error"
    local msg=""
    if ! run "$cmd"; then
        echo "Ninja build failed for ${build_dir}."
        local msg="Build failed for ${build_type}. Check the log for details."
        local icons="dialog-error"
        notify-send --icon="$icons" "$header" "$msg"
        exit 1
    fi

    # Send a notification when done
    icons="dialog-information"
    msg="Build complete for ${build_type}"
    notify-send --icon="$icons" "$header" "$msg"
}

build_debug() {
    local show_log="$1"
    shift
    build_with_cmake "$OUT_DIR" "Debug" "clang++" "$show_log" "$@"
}

build_release() {
    local show_log="$1"
    local release_dir="${OUT_DIR}-release"
    shift
    build_with_cmake "$release_dir" "Release" "clang++" "$show_log" "$@"
}

build_profile() {
    local show_log="$1"
    local profile_dir="${OUT_DIR}-profile"
    shift
    build_with_cmake "$profile_dir" "Profile" "clang++" "$show_log" "$@"
}

# Determine build mode from first argument (default is debug) and shift it off.
if [ $# -eq 0 ]; then
    MODE="debug"
else
    MODE="$1"
    shift
fi

# Determine if we should show the log (default is no).
SHOW_LOG="no"
if [ $# -gt 0 ] && { [ "$1" = "yes" ] || [ "$1" = "no" ]; }; then
    SHOW_LOG="$1"
    shift
fi

case "$MODE" in
debug)
    build_debug "$SHOW_LOG" "$@"
    ;;
release)
    build_release "$SHOW_LOG" "$@"
    ;;
profile)
    build_profile "$SHOW_LOG" "$@"
    ;;
all)
    echo "Building all configurations concurrently..."
    build_debug "no" "$@" &
    build_release "no" "$@" &
    build_profile "no" "$@" &
    wait
    ;;
*)
    usage
    ;;
esac
