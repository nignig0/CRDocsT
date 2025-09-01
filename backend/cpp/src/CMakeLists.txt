set(DTYPE ${CMAKE_SOURCE_DIR}/src/dtype)
set(ORDER ${DTYPE}/order)

file(GLOB ORDER_INC ${ORDER}/*.cpp ${ORDER}/*.hpp)
file(GLOB DTYPE_INC ${DTYPE}/*.cpp ${DTYPE}/*.hpp)

add_executable(backend main.cpp ${ORDER_INC} ${DTYPE_INC})
