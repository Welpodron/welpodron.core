<?php

namespace Welpodron\Core;

use Welpodron\Core\Patterns\Singleton;

class Storage extends Singleton
{
    const MAX_CONTEXTS = 5;
    const MAX_CONTEXT_ELEMENTS = 50;

    private $contexts = [];

    public function getContexts()
    {
        return $this->contexts;
    }

    public function getContext(string $context): array
    {
        return $this->contexts[$context];
    }

    public function setContext(string $context, array $values = [])
    {
        if (count($values) > self::MAX_CONTEXT_ELEMENTS) {
            return false;
        }
        
        if (in_array($context, $this->contexts)) {
            $this->contexts[$context] = $values;

            return true;
        }

        if (count($this->contexts) >= self::MAX_CONTEXTS) {
            return false;
        }

        $this->contexts[$context] = $values;

        return true;
    }

    public function addContext(string $context, array $values = [])
    {
        if (count($values) > self::MAX_CONTEXT_ELEMENTS) {
            return false;
        }

        if (count($this->contexts) >= self::MAX_CONTEXTS) {
            return false;
        }
        
        if (in_array($context, $this->contexts)) {
            return false;
        }

        $this->contexts[$context] = $values;

        return true;
    }

    public function addValue(string $context, $key, $value)
    {
        if (!in_array($context, $this->contexts)) {
            return false;
        }

        if (count($this->contexts[$context]) >= self::MAX_CONTEXT_ELEMENTS) {
            return false;
        }

        if (in_array($key, $this->contexts[$context])) {
            return false;
        }

        $this->contexts[$context][$key] = $value;

        return true;
    }

    public function setValue(string $context, $key, $value)
    {
        if (!in_array($context, $this->contexts)) {
            return false;
        }

        if (!in_array($key, $this->contexts[$context])) {
            return false;
        }

        $this->contexts[$context][$key] = $value;

        return true;
    }

    public function getValue(string $context, $key)
    {
        return $this->contexts[$context][$key];
    }

    public function removeValue(string $context, $key)
    {
        if (!in_array($context, $this->contexts)) {
            return false;
        }

        if (!in_array($key, $this->contexts[$context])) {
            return false;
        }

        unset($this->contexts[$context][$key]);

        return true;
    }

    public function removeContext(string $context)
    {
        if (!in_array($context, $this->contexts)) {
            return false;
        }

        unset($this->contexts[$context]);

        return true;
    }

    public function clearContext(string $context)
    {
        if (!in_array($context, $this->contexts)) {
            return false;
        }

        $this->contexts[$context] = [];

        return true;
    }
}
