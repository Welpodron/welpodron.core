<?php

namespace Welpodron\Core;

abstract class Entity
{
    final public static function getChildren($namespace = false)
    {
        $result = [];
        foreach (get_declared_classes() as $class) {
            if (is_subclass_of($class, static::class)) {
                $result[] = $class::getClass($namespace);
            }
        }
        return $result;
    }

    final public static function getClass($namespace = false)
    {
        return $namespace === true ? get_called_class() : substr(static::class, ($p = strrpos(static::class, '\\')) !== false ? $p + 1 : 0);
    }

    final public static function getParent($namespace = false)
    {
        $className = static::class;

        $parent = get_parent_class($className);

        return $parent::getClass($namespace);
    }

    final public static function getParents($namespace = false)
    {
        $chain = [];
        return $function = function ($className = '') use (&$chain, &$function) {
            if (empty($className)) {
                $className = static::class;
            }

            // if (empty($chain)) {
            //     $chain[] = self::getClass($namespace);
            // }

            $parent = get_parent_class($className);

            if ($parent !== false) {
                $chain[] = $parent::getClass($namespace);
                return $function($parent);
            }

            return $chain;
        };
    }
}